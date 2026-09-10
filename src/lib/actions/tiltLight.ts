import type { Action } from 'svelte/action';

export interface TiltLightOptions {
	/** 이 각도(도)만큼 기울이면 효과가 끝까지 간다. */
	range?: number;
	/** 사람이 폰을 들고 보는 평균 각도(도). 이 자세를 정면으로 친다. */
	restAngle?: number;
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

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
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

/**
 * 기기를 기울이면 페이지가 화면 위에 떠 있는 것처럼 기울고 흐르며,
 * 같은 광원이 표면을 훑고 지나간다.
 *
 * 변환은 matrix3d 하나로 직접 계산한다. 회전축을 문서 중앙이 아니라 지금
 * 보고 있는 화면 중앙으로 옮겨야 하기 때문이다. 4000px가 넘는 문서를 제
 * 중앙 기준으로 회전시키면 위아래 끝이 Z축으로 수백 px씩 밀려서, 페이지
 * 위쪽이 아래쪽보다 눈에 띄게 커 보이고 스크롤할 때마다 배율이 변한다.
 * 축을 화면 중앙에 두면 보이는 영역은 언제나 축 근처라 왜곡이 일정하다.
 *
 * 원근도 부모의 perspective 속성에 맡기지 않고 행렬에 함께 넣는다. 그래야
 * 축을 옮긴 좌표계 안에서 원근이 걸린다.
 *
 * 기울기 센서 전용이다. 센서가 없거나 허가를 받지 못하면 세기가 0에 머물러
 * 아무것도 그려지지 않는다.
 */
export const tiltLight: Action<HTMLElement, TiltLightOptions | undefined> = (node, options) => {
	const range = options?.range ?? 35;
	const restAngle = options?.restAngle ?? 45;
	const smoothing = options?.smoothing ?? 0.3;
	const depth = options?.depth ?? 8;
	const rotate = options?.rotate ?? 5;
	const distance = options?.perspective ?? 1200;
	const lead = options?.lead ?? 3;

	/** 예측이 한 번에 밀어낼 수 있는 최대 각도. 센서가 튈 때 화면이 날아가지 않게 막는다. */
	const maxLead = range * 0.6;

	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

	// 화면 기준 0~1 좌표. 살짝 위쪽에서 비추는 것이 기본 자세다.
	let targetX = 0.5;
	let targetY = 0.3;
	let x = targetX;
	let y = targetY;
	let strength = 0;
	let targetStrength = 0;
	let frame = 0;
	let gotReading = false;

	// 예측에 쓰는 직전 각도와 각속도(이벤트 한 번당 도).
	let lastGamma: number | null = null;
	let lastBeta = restAngle;
	let velocityGamma = 0;
	let velocityBeta = 0;

	function writeMatrix() {
		// 지금 보고 있는 화면의 중앙을 회전축으로 삼는다.
		const pivot = window.scrollY + window.innerHeight / 2;

		const nx = (x - 0.5) * 2;
		const ny = (y - 0.5) * 2;

		const tx = nx * depth * strength;
		const ty = ny * depth * strength;
		const ry = -nx * rotate * strength;
		const rx = ny * rotate * strength;

		// 축을 원점으로 옮기고 → 이동 → 회전 → 원근 → 다시 제자리로.
		let m = translation(0, pivot, 0);
		m = multiply(m, perspectiveMatrix(distance));
		m = multiply(m, rotationX(rx));
		m = multiply(m, rotationY(ry));
		m = multiply(m, translation(tx, ty, 0));
		m = multiply(m, translation(0, -pivot, 0));

		const value = m.map((n) => Number(n.toFixed(6))).join(',');
		node.style.setProperty('--tilt-matrix', `matrix3d(${value})`);
	}

	function loop() {
		x += (targetX - x) * smoothing;
		y += (targetY - y) * smoothing;
		strength += (targetStrength - strength) * FADE_IN;

		node.style.setProperty('--lx', `${(x * 100).toFixed(1)}%`);
		node.style.setProperty('--ly', `${(y * 100).toFixed(1)}%`);
		node.style.setProperty('--light-strength', strength.toFixed(3));
		writeMatrix();

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

		const gamma = event.gamma ?? 0;
		const beta = event.beta ?? restAngle;

		// 각속도를 추정해 그만큼 앞질러 간다. 손을 멈추면 각속도가 0으로
		// 잦아들면서 목표도 실제 각도로 되돌아오므로 어긋난 채로 남지 않는다.
		if (lastGamma !== null) {
			velocityGamma += (gamma - lastGamma - velocityGamma) * VELOCITY_TRACK;
			velocityBeta += (beta - lastBeta - velocityBeta) * VELOCITY_TRACK;
		}
		lastGamma = gamma;
		lastBeta = beta;

		const predictedGamma = gamma + clamp(velocityGamma * lead, -maxLead, maxLead);
		const predictedBeta = beta + clamp(velocityBeta * lead, -maxLead, maxLead);

		// 기기를 오른쪽으로 기울이면 빛은 왼쪽으로 흐르므로 부호를 뒤집는다.
		targetX = clamp01(0.5 - predictedGamma / (range * 2));
		targetY = clamp01(0.5 - (predictedBeta - restAngle) / (range * 2));
		targetStrength = 1;
		start();
	}

	/** 축이 화면을 따라다니므로 스크롤하면 행렬을 다시 써야 한다. */
	function onScroll() {
		if (strength > 0) writeMatrix();
	}

	function listenToSensor() {
		window.addEventListener('deviceorientation', onOrientation);
	}

	// 일단 붙여둔다. 허가가 필요한 환경이면 이벤트가 오지 않을 뿐 해로울 게 없고,
	// 안드로이드처럼 그냥 되는 환경에서는 버튼 없이 곧바로 동작한다.
	listenToSensor();
	window.addEventListener('tiltlight:granted', listenToSensor);
	window.addEventListener('scroll', onScroll, { passive: true });

	// 값이 안 들어오는데 물어볼 수 있는 환경이라면, 그때만 버튼을 띄운다.
	const probe = setTimeout(() => {
		if (gotReading || !canAskForTilt()) return;
		window.dispatchEvent(new Event('tiltlight:needspermission'));
	}, PROBE_MS);

	return {
		destroy() {
			if (frame) cancelAnimationFrame(frame);
			clearTimeout(probe);
			window.removeEventListener('deviceorientation', onOrientation);
			window.removeEventListener('tiltlight:granted', listenToSensor);
			window.removeEventListener('scroll', onScroll);
		}
	};
};
