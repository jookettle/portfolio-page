import type { Action } from 'svelte/action';

export interface TiltLightOptions {
	/** 이 각도(도)만큼 기울이면 반사광이 끝까지 이동한다. */
	range?: number;
	/** 사람이 폰을 들고 보는 평균 각도(도). 이 자세를 정면으로 친다. */
	restAngle?: number;
	/** 0~1. 클수록 빛이 즉각 따라오고, 작을수록 미끄러지듯 따라온다. */
	smoothing?: number;
	/**
	 * 기울기에 따라 페이지가 움직이는 최대 거리(px). 화면 위에 살짝 떠 있는
	 * 느낌을 주는 정도면 충분하고, 키우면 글을 읽기 어려워진다.
	 * 방향을 뒤집고 싶으면 음수를 준다.
	 */
	depth?: number;
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

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

/**
 * 기기를 기울이면 함께 움직이는 광원.
 *
 * 광원의 위치를 --lx / --ly로 내려보내면 하위의 .lit 요소들이 상속받아
 * 각자의 반사광을 그린다. 요소마다 좌표를 따로 계산하지 않기 때문에 비용은
 * 사실상 커스텀 속성 세 개를 갱신하는 것뿐이고, 화면 전체의 빛이 한 방향으로
 * 함께 쓸리는 모습이 되어 실제 광원처럼 읽힌다.
 *
 * 기울기 센서 전용이다. 센서가 없거나 허가를 받지 못하면 --light-strength가
 * 0에 머물러 반사광이 전혀 그려지지 않고, 나머지 화면은 그대로 동작한다.
 */
export const tiltLight: Action<HTMLElement, TiltLightOptions | undefined> = (node, options) => {
	const range = options?.range ?? 35;
	const restAngle = options?.restAngle ?? 45;
	const smoothing = options?.smoothing ?? 0.12;
	const depth = options?.depth ?? 8;

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

	function loop() {
		x += (targetX - x) * smoothing;
		y += (targetY - y) * smoothing;
		strength += (targetStrength - strength) * smoothing;

		node.style.setProperty('--lx', `${(x * 100).toFixed(1)}%`);
		node.style.setProperty('--ly', `${(y * 100).toFixed(1)}%`);
		node.style.setProperty('--light-strength', strength.toFixed(3));

		// 빛과 같은 방향으로 페이지도 아주 조금 흐르게 해서 떠 있는 느낌을 준다.
		// strength를 곱해두면 센서가 붙는 순간 튀지 않고 함께 스며든다.
		const offsetX = (x - 0.5) * 2 * depth * strength;
		const offsetY = (y - 0.5) * 2 * depth * strength;
		node.style.setProperty('--tilt-x', `${offsetX.toFixed(2)}px`);
		node.style.setProperty('--tilt-y', `${offsetY.toFixed(2)}px`);

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
		// gamma: 좌우 기울기(-90~90), beta: 앞뒤 기울기(-180~180).
		// 기기를 오른쪽으로 기울이면 빛은 왼쪽으로 흐르므로 부호를 뒤집는다.
		// 센서가 없는 기기에서도 이벤트만 빈 값으로 오는 경우가 있다.
		if (event.gamma === null && event.beta === null) return;
		gotReading = true;

		const gamma = event.gamma ?? 0;
		const beta = event.beta ?? restAngle;
		targetX = clamp01(0.5 - gamma / (range * 2));
		targetY = clamp01(0.5 - (beta - restAngle) / (range * 2));
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
			window.removeEventListener('deviceorientation', onOrientation);
			window.removeEventListener('tiltlight:granted', listenToSensor);
		}
	};
};
