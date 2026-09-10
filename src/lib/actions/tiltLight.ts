import type { Action } from 'svelte/action';
import { guessLocation, parseSunOverride, sunLight } from '$lib/sun';

export interface TiltLightOptions {
	/** 중립에서 이 각도(도)만큼 더 기울이면 효과가 끝까지 간다. */
	range?: number;
	/**
	 * 중립 자세가 지금 자세를 따라가는 속도(0~1). 0에 가까울수록 처음 자세를
	 * 오래 기억하고, 키우면 금방 다시 중앙으로 돌아온다.
	 */
	recenter?: number;
	/** 0~1. 클수록 기울기를 즉각 따라오고, 작을수록 미끄러지듯 따라온다. */
	smoothing?: number;
	/** 페이지가 흐르는 최대 거리(px). 음수를 주면 방향이 뒤집힌다. */
	depth?: number;
	/** 최대 회전 각도(도). 3D 느낌을 만드는 값이라 조금만 있어도 크게 달라진다. */
	rotate?: number;
	/** 원근 거리(px). 작을수록 왜곡이 세진다. */
	perspective?: number;
	/**
	 * 각속도를 몇 번의 이벤트만큼 앞질러 반영할지.
	 * 센서와 보간이 만드는 지연을 상쇄해 손을 따라오는 느낌을 준다.
	 */
	lead?: number;
}

/**
 * 허가를 물어볼 수 있는 환경인지.
 *
 * requestPermission의 존재만으로는 iOS를 가려낼 수 없다. Chromium도 133부터
 * 같은 함수를 노출하기 때문에, 그것만 보면 데스크톱에서도 참이 된다.
 * 그래서 센서가 있을 법한 기기인지를 함께 본다. 최종 판단은 실제로 값이
 * 들어오는지 확인하는 쪽(아래 탐지 로직)이 맡는다.
 */
export function canAskForTilt(): boolean {
	if (typeof window === 'undefined') return false;
	if (!window.matchMedia('(pointer: coarse)').matches) return false;
	return (
		typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown })
			?.requestPermission === 'function'
	);
}

/**
 * 허가를 요청한다. 반드시 클릭/탭 핸들러 안에서 호출해야 하며,
 * 그렇지 않으면 iOS가 조용히 거절한다.
 */
export async function requestTiltPermission(): Promise<boolean> {
	if (!canAskForTilt()) return true;
	try {
		const request = (
			DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
		).requestPermission;
		const state = await request();
		const granted = state === 'granted';
		if (granted) window.dispatchEvent(new Event('tiltlight:granted'));
		return granted;
	} catch {
		return false;
	}
}

/** 목표값에 이만큼 가까워지면 루프를 끝낸다. */
const SETTLE = 0.001;
/** 센서 값이 들어오는지 지켜보는 시간(ms). */
const PROBE_MS = 1200;
/**
 * 효과가 처음 나타날 때의 페이드인 속도. 위치 추종과 따로 두는 이유는,
 * 같은 값을 쓰면 추종을 빠르게 할수록 센서가 붙는 순간 효과가 툭 튀어나오기
 * 때문이다. 위치는 즉각 따라오되 등장은 부드럽게 한다.
 */
const FADE_IN = 0.05;
/** 각속도 추정의 반응 속도(0~1). 높을수록 최근 움직임을 크게 반영한다. */
const VELOCITY_TRACK = 0.5;
/** 센서 입력을 거르는 기본 정도. 아래 TARGET_DEADBAND와 함께 실측으로 정했다. */
const INPUT_SMOOTHING = 0.3;
/** 기울기가 빛을 태양 위치에서 얼마나 흔들 수 있는지(화면 비율). */
const LIGHT_SWAY = 0.4;
/** 색 없는 번짐의 바탕이 되는 푸른 회색. */
const AMBIENT_BASE = [88, 100, 128];
/**
 * 기울기 목표가 이만큼(화면 비율) 이상 바뀔 때만 따라간다. 반응 범위가 15도이므로
 * 약 0.45도에 해당한다.
 *
 * INPUT_SMOOTHING과 함께 가상 센서(떨림 0.08도, 10초)로 재서 정했다. 둘 다 없으면
 * 가만히 들고 있어도 애니메이션을 570번 깨웠고, 이 조합에서는 0번이다(손이 많이
 * 떨리면 21번). 100ms에 걸쳐 3도 기울였을 때 목표는 100ms 만에 따라잡는다.
 */
const TARGET_DEADBAND = 0.015;

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

/**
 * 가운데에서 빛 쪽을 가리키는 CSS 그라데이션 각도(도).
 * CSS는 0도가 위, 90도가 오른쪽이고 화면 y축은 아래로 자라므로 dy의 부호를 뒤집는다.
 */
export const lightAngle = (dx: number, dy: number) => (Math.atan2(dx, -dy) * 180) / Math.PI;
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/*
 * 4x4 행렬. CSS matrix3d와 같은 열 우선(column-major) 순서로 다룬다.
 * m[col * 4 + row] 형태이며, 그대로 이어붙이면 matrix3d의 인자가 된다.
 */
type Mat4 = number[];

function multiply(a: Mat4, b: Mat4): Mat4 {
	const out: Mat4 = new Array(16).fill(0);
	for (let col = 0; col < 4; col++) {
		for (let row = 0; row < 4; row++) {
			let sum = 0;
			for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[col * 4 + k];
			out[col * 4 + row] = sum;
		}
	}
	return out;
}

const translation = (x: number, y: number, z: number): Mat4 => [
	1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1
];

function rotationX(deg: number): Mat4 {
	const r = (deg * Math.PI) / 180;
	const c = Math.cos(r);
	const s = Math.sin(r);
	return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}

function rotationY(deg: number): Mat4 {
	const r = (deg * Math.PI) / 180;
	const c = Math.cos(r);
	const s = Math.sin(r);
	return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}

/** CSS perspective(d)와 같은 행렬. 행 4·열 3 자리가 -1/d 이다. */
const perspectiveMatrix = (d: number): Mat4 => [
	1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 / d, 0, 0, 0, 1
];

export interface TiltTracker {
	/** 센서 각도를 받아 화면 기준 0~1 좌표를 돌려준다. 0.5가 중립이다. */
	update(gamma: number, beta: number): { x: number; y: number };
}

/**
 * 센서 각도를 화면 좌표로 옮기는 계산만 담당한다. DOM을 건드리지 않으므로
 * 따로 떼어 검증할 수 있다.
 *
 * 절대 각도가 아니라 중립 자세로부터의 변화량을 쓴다. iOS의
 * UIInterpolatingMotionEffect가 기준 자세의 역을 곱해 상대 회전만 보는 것과
 * 같은 이유다. 특정 각도로 들고 본다고 가정하면 사람마다 자세가 달라 가만히
 * 있어도 화면이 한쪽으로 기울어진 채 고정된다.
 */
export function createTiltTracker(config: {
	range: number;
	recenter: number;
	lead: number;
	/**
	 * 센서 입력을 거르는 정도(0~1). 1이면 거르지 않는다.
	 * 예측은 각속도를 부풀려 쓰기 때문에 거르지 않은 떨림을 예측하면 떨림도 함께
	 * 부풀려진다. 그래서 예측하기 전에 먼저 거른다.
	 */
	inputSmoothing?: number;
}): TiltTracker {
	const { range, recenter, lead } = config;
	const inputSmoothing = config.inputSmoothing ?? INPUT_SMOOTHING;
	/** 예측이 한 번에 밀어낼 수 있는 최대 각도. 센서가 튈 때 화면이 날아가지 않게 막는다. */
	const maxLead = range * 0.6;

	let reference: { gamma: number; beta: number } | null = null;
	let lastGamma: number | null = null;
	let lastBeta = 0;
	let velocityGamma = 0;
	let velocityBeta = 0;
	let filtered: { gamma: number; beta: number } | null = null;

	return {
		update(rawGamma, rawBeta) {
			// 오일러각이 튀는 구간(beta ±90° 부근)에서는 거르면 오히려 중간값이 번져
			// 나오므로, 크게 뛰면 거르지 않고 새 값에서 다시 시작한다.
			if (
				filtered === null ||
				Math.abs(rawGamma - filtered.gamma) > 90 ||
				Math.abs(rawBeta - filtered.beta) > 90
			) {
				filtered = { gamma: rawGamma, beta: rawBeta };
			} else {
				filtered.gamma += (rawGamma - filtered.gamma) * inputSmoothing;
				filtered.beta += (rawBeta - filtered.beta) * inputSmoothing;
			}
			const gamma = filtered.gamma;
			const beta = filtered.beta;

			if (reference === null) reference = { gamma, beta };

			let deltaGamma = gamma - reference.gamma;
			let deltaBeta = beta - reference.beta;

			// beta가 ±90°를 지날 때 오일러각이 튀는 구간이 있다. 말이 안 되는
			// 변화량이 나오면 그 자세를 새 중립으로 잡고 넘어간다.
			if (Math.abs(deltaGamma) > 90 || Math.abs(deltaBeta) > 90) {
				reference = { gamma, beta };
				deltaGamma = 0;
				deltaBeta = 0;
			}

			// 자세를 바꾸면 중립도 천천히 따라가서 다시 중앙으로 돌아온다.
			reference.gamma += deltaGamma * recenter;
			reference.beta += deltaBeta * recenter;

			// 각속도를 추정해 그만큼 앞질러 간다. 손을 멈추면 각속도가 0으로
			// 잦아들면서 목표도 실제 각도로 되돌아오므로 어긋난 채 남지 않는다.
			if (lastGamma !== null) {
				velocityGamma += (gamma - lastGamma - velocityGamma) * VELOCITY_TRACK;
				velocityBeta += (beta - lastBeta - velocityBeta) * VELOCITY_TRACK;
			}
			lastGamma = gamma;
			lastBeta = beta;

			const predictedGamma = deltaGamma + clamp(velocityGamma * lead, -maxLead, maxLead);
			const predictedBeta = deltaBeta + clamp(velocityBeta * lead, -maxLead, maxLead);

			// 기울인 쪽으로 화면과 빛이 함께 따라간다.
			return {
				x: clamp01(0.5 + predictedGamma / (range * 2)),
				y: clamp01(0.5 + predictedBeta / (range * 2))
			};
		}
	};
}

/**
 * 기기를 기울이면 화면이 떠 있는 판처럼 기울고 흐르며, 같은 광원이 표면을
 * 훑고 지나간다.
 *
 * 변환은 문서가 아니라 화면 크기의 판에 건다. 긴 문서에 3D 변환을 걸면 판의
 * 테두리가 보이지 않아서, 화면이 기우는 게 아니라 글자가 일그러지는 것으로만
 * 보인다. 그래서 센서가 값을 보내기 시작하면 페이지를 화면에 고정된 판으로
 * 바꾸고(.tilt-active), 내용은 그 안에서 스크롤 위치만큼 끌어올린다. 판이 기울면
 * 가장자리로 뒤쪽 바탕이 드러나 떠 있는 화면으로 읽힌다.
 *
 * 문서 스크롤 자체는 그대로 둔다. 내용과 같은 높이의 빈 요소가 문서를 채우고
 * 있어서 브라우저는 평소처럼 스크롤하고, 모바일 주소창이 접히는 동작도 유지된다.
 * 센서가 없는 데스크톱은 이 모드에 들어가지 않으므로 아무것도 달라지지 않는다.
 *
 * 판이 화면 크기이므로 회전축은 CSS 기본 transform-origin(판의 중앙)이 그대로
 * 맡는다. 행렬에는 원근·회전·이동만 담는다.
 *
 * 기울기는 절대 각도가 아니라 중립 자세로부터의 변화량으로 다룬다. 자세한
 * 이유는 createTiltTracker의 주석에 있다.
 *
 * 기울기 센서 전용이다. 센서가 없거나 허가를 받지 못하면 세기가 0에 머물러
 * 아무것도 그려지지 않는다.
 */
export const tiltLight: Action<HTMLElement, TiltLightOptions | undefined> = (node, options) => {
	const range = options?.range ?? 15;
	const recenter = options?.recenter ?? 0.004;
	const smoothing = options?.smoothing ?? 0.3;
	const depth = options?.depth ?? 5;
	const rotate = options?.rotate ?? 2.5;
	const distance = options?.perspective ?? 1600;
	const lead = options?.lead ?? 2;

	const tracker = createTiltTracker({ range, recenter, lead });

	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

	// 기울기(0~1, 0.5가 중립). 판의 움직임은 오직 이 값만 따른다.
	let targetX = 0.5;
	let targetY = 0.5;
	let x = targetX;
	let y = targetY;
	let strength = 0;
	let targetStrength = 0;
	let frame = 0;
	let gotReading = false;

	const content = node.querySelector<HTMLElement>('.float-content');
	let active = false;

	// 빛의 기본 위치와 색은 지금 이 순간의 태양이 정하고, 기울기는 그 위에 더해진다.
	const location = guessLocation(
		Intl.DateTimeFormat().resolvedOptions().timeZone,
		new Date().getTimezoneOffset()
	);
	const sunOverride = parseSunOverride(window.location.search);
	let sun = sunLight(sunOverride ?? new Date(), location.lat, location.lon);
	let sunTimer = 0;

	function writeAll() {
		const nx = (x - 0.5) * 2;
		const ny = (y - 0.5) * 2;

		// 판: 기울기만 따른다. 태양이 섞이면 폰을 가만히 둬도 판이 해 쪽으로 기운다.
		const tx = nx * depth * strength;
		const ty = ny * depth * strength;
		const ry = -nx * rotate * strength;
		const rx = ny * rotate * strength;

		// 원근 → 회전 → 이동. 축은 transform-origin(판의 중앙)이 맡는다.
		let m = perspectiveMatrix(distance);
		m = multiply(m, rotationX(rx));
		m = multiply(m, rotationY(ry));
		m = multiply(m, translation(tx, ty, 0));

		const value = m.map((n) => Number(n.toFixed(6))).join(',');
		node.style.setProperty('--tilt-matrix', `matrix3d(${value})`);

		// 떠 있는 카드의 시차와 유리 반사는 판과 같은 기울기를 쓴다.
		node.style.setProperty('--tilt-nx', (nx * strength).toFixed(4));
		node.style.setProperty('--tilt-ny', (ny * strength).toFixed(4));

		// 빛: 태양 위치를 중심으로 기울기만큼 흔들린다.
		const lx = clamp01(sun.x + nx * LIGHT_SWAY);
		const ly = clamp01(sun.y + ny * LIGHT_SWAY);
		node.style.setProperty('--lx', `${(lx * 100).toFixed(1)}%`);
		node.style.setProperty('--ly', `${(ly * 100).toFixed(1)}%`);
		node.style.setProperty('--light-angle', `${lightAngle(lx - 0.5, ly - 0.5).toFixed(1)}deg`);
		node.style.setProperty('--light-strength', strength.toFixed(3));
		node.style.setProperty('--light-rgb', sun.rgb.join(', '));
		node.style.setProperty('--sun-intensity', sun.intensity.toFixed(3));
		// 색을 못 찾은 표면의 번짐 색. 빛의 색만 쓰면 한낮엔 흰빛이라 흰 바탕에서
		// 사라지므로, 푸른 회색에 섞어 어느 시각에나 옅게 보이게 한다.
		node.style.setProperty(
			'--ambient-rgb',
			sun.rgb.map((c, i) => Math.round(c * 0.45 + AMBIENT_BASE[i] * 0.55)).join(', ')
		);

		// 그림자는 빛의 반대쪽으로 드리워지고, 해가 낮을수록 길어진다.
		node.style.setProperty('--shadow-dx', (-(lx - 0.5) * 2 * sun.shadowLength).toFixed(3));
		node.style.setProperty('--shadow-dy', (-(ly - 0.5) * 2 * sun.shadowLength).toFixed(3));
	}

	/** 해는 천천히 움직이므로 1분에 한 번이면 충분하다. */
	function watchSun() {
		if (sunOverride || sunTimer) return;
		sunTimer = window.setInterval(() => {
			sun = sunLight(new Date(), location.lat, location.lon);
			if (active) writeAll();
		}, 60_000);
	}

	/**
	 * 페이지를 화면에 고정된 판으로 바꾼다. 이때부터 문서는 스크롤되지 않고,
	 * 판 안의 내용(.float-content)이 브라우저의 기본 스크롤로 움직인다.
	 *
	 * 예전에는 문서를 스크롤시키고 그 위치만큼 JS로 내용을 끌어올렸다. 그러면
	 * 스크롤이 합성 단계가 아니라 메인 스레드를 거쳐 손가락보다 한 박자씩 늦고,
	 * 120Hz 화면에서도 60Hz로 끊겨 보였다. 기본 스크롤은 화면 주사율 그대로 돈다.
	 *
	 * 클래스를 붙이면 내용이 문서 흐름에서 빠져 문서 스크롤이 0이 되므로, 위치를
	 * 먼저 읽어 두었다가 판 안의 스크롤로 옮긴다. 같은 작업 안에서 옮기기 때문에
	 * 튀는 순간이 화면에 그려지지 않는다. 이 시점에는 세기가 0이라 행렬도 항등이다.
	 */
	function activate() {
		if (active || !content) return;
		const y = window.scrollY;
		document.documentElement.classList.add('tilt-lock');
		node.classList.add('tilt-active');
		content.scrollTop = y;
		active = true;
		watchSun();
	}

	function loop() {
		x += (targetX - x) * smoothing;
		y += (targetY - y) * smoothing;
		strength += (targetStrength - strength) * FADE_IN;

		writeAll();

		const settled =
			Math.abs(targetX - x) < SETTLE &&
			Math.abs(targetY - y) < SETTLE &&
			Math.abs(targetStrength - strength) < SETTLE;
		frame = settled ? 0 : requestAnimationFrame(loop);
	}

	function start() {
		if (frame || reduceMotion.matches) return;
		frame = requestAnimationFrame(loop);
	}

	function onOrientation(event: DeviceOrientationEvent) {
		// 센서가 없는 기기에서도 이벤트만 빈 값으로 오는 경우가 있다.
		if (event.gamma === null && event.beta === null) return;
		gotReading = true;

		if (reduceMotion.matches) return;
		activate();

		const next = tracker.update(event.gamma ?? 0, event.beta ?? 0);

		// 손에 든 폰은 가만히 있어도 센서 값이 0.1도 안팎으로 떨린다. 그 떨림까지
		// 따라가면 목표가 매번 조금씩 바뀌어 애니메이션이 영영 멈추지 않고, 매 프레임
		// 페이지 전체의 스타일을 다시 계산하느라 스크롤까지 끊긴다.
		const moved =
			Math.abs(next.x - targetX) > TARGET_DEADBAND || Math.abs(next.y - targetY) > TARGET_DEADBAND;
		if (!moved && targetStrength === 1) return;

		targetX = next.x;
		targetY = next.y;
		targetStrength = 1;
		start();
	}

	function listenToSensor() {
		window.addEventListener('deviceorientation', onOrientation);
	}

	// 일단 붙여둔다. 허가가 필요한 환경이면 이벤트가 오지 않을 뿐 해로울 게 없고,
	// 안드로이드처럼 그냥 되는 환경에서는 버튼 없이 곧바로 동작한다.
	listenToSensor();
	window.addEventListener('tiltlight:granted', listenToSensor);

	// 값이 안 들어오는데 물어볼 수 있는 환경이라면, 그때만 버튼을 띄운다.
	const probe = setTimeout(() => {
		if (gotReading || !canAskForTilt()) return;
		window.dispatchEvent(new Event('tiltlight:needspermission'));
	}, PROBE_MS);

	return {
		destroy() {
			if (frame) cancelAnimationFrame(frame);
			clearTimeout(probe);
			clearInterval(sunTimer);
			node.classList.remove('tilt-active');
			document.documentElement.classList.remove('tilt-lock');
			window.removeEventListener('deviceorientation', onOrientation);
			window.removeEventListener('tiltlight:granted', listenToSensor);
		}
	};
};
