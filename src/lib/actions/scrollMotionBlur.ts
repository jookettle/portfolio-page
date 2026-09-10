import type { Action } from 'svelte/action';

export interface ScrollMotionBlurOptions {
	/** 블러 상한(px). 너무 키우면 글자가 읽히지 않는다. */
	max?: number;
	/** 스크롤 속도(px/frame) 1당 붙는 블러의 양. */
	sensitivity?: number;
	/** 0~1. 클수록 속도 변화에 즉각 반응하고, 작을수록 여운이 길게 남는다. */
	smoothing?: number;
}

/**
 * 스크롤 속도에 따라 세로 모션블러를 거는 액션.
 *
 * 실제 모션블러는 셔터가 열려 있는 동안 피사체가 이동한 거리에 비례하므로
 * 가속도가 아니라 속도를 기준으로 계산한다. 대신 목표값을 그대로 쓰지 않고
 * smoothing으로 따라가게 해서, 속도가 붙고 풀리는 과정이 부드럽게 느껴지도록 했다.
 *
 * CSS의 blur()은 사방으로 번져 초점이 나간 것처럼 보이기 때문에,
 * 세로 성분만 가진 feGaussianBlur를 써서 스크롤 방향으로만 번지게 한다.
 */
export const scrollMotionBlur: Action<HTMLElement, ScrollMotionBlurOptions | undefined> = (
	node,
	options
) => {
	// 휠 한 칸은 대략 20~30px/frame으로 움직인다. 그 구간에서 1.8~2.7px 정도가
	// 걸리고, 빠르게 튕겼을 때만 상한에 닿도록 잡은 값이다.
	const max = options?.max ?? 4;
	const sensitivity = options?.sensitivity ?? 0.09;
	const smoothing = options?.smoothing ?? 0.55;

	/** 이 값 아래로 떨어지면 블러를 걷어낸다. */
	const MIN_BLUR = 0.15;
	/** 멈춘 뒤 이만큼의 프레임이 지나면 rAF 루프를 끊는다. */
	const IDLE_FRAMES = 5;

	const NS = 'http://www.w3.org/2000/svg';
	const id = `scroll-motion-blur-${Math.random().toString(36).slice(2, 8)}`;

	const svg = document.createElementNS(NS, 'svg');
	svg.setAttribute('aria-hidden', 'true');
	svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';

	const filter = document.createElementNS(NS, 'filter');
	filter.setAttribute('id', id);
	// 가로로는 번지지 않으므로 필터 영역을 세로로만 넓힌다.
	filter.setAttribute('x', '0%');
	filter.setAttribute('width', '100%');
	filter.setAttribute('y', '-10%');
	filter.setAttribute('height', '120%');
	// 기본값(linearRGB)으로 두면 색이 빠져 보인다.
	filter.setAttribute('color-interpolation-filters', 'sRGB');

	const gaussian = document.createElementNS(NS, 'feGaussianBlur');
	gaussian.setAttribute('stdDeviation', '0 0');
	filter.appendChild(gaussian);
	svg.appendChild(filter);
	document.body.appendChild(svg);

	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

	let frame = 0;
	let lastY = window.scrollY;
	let blur = 0;
	let idle = 0;
	let applied = false;

	function apply() {
		node.style.filter = `url(#${id})`;
		node.style.willChange = 'filter';
		applied = true;
	}

	function clear() {
		// 멈춘 뒤에도 필터를 걸어두면 브라우저가 페이지 전체를 계속 다시 그린다.
		node.style.filter = '';
		node.style.willChange = '';
		gaussian.setAttribute('stdDeviation', '0 0');
		blur = 0;
		applied = false;
	}

	function tick() {
		const y = window.scrollY;
		const velocity = Math.abs(y - lastY);
		lastY = y;

		const target = Math.min(velocity * sensitivity, max);
		blur += (target - blur) * smoothing;

		if (blur > MIN_BLUR) {
			idle = 0;
			gaussian.setAttribute('stdDeviation', `0 ${blur.toFixed(2)}`);
			if (!applied) apply();
		} else {
			if (applied) clear();
			idle++;
		}

		if (idle > IDLE_FRAMES) {
			frame = 0;
			return;
		}
		frame = requestAnimationFrame(tick);
	}

	function onScroll() {
		if (frame || reduceMotion.matches) return;
		// 루프가 꺼져 있는 동안 벌어진 간격을 속도로 오해하지 않도록 기준점을 다시 잡는다.
		lastY = window.scrollY;
		idle = 0;
		frame = requestAnimationFrame(tick);
	}

	function onPreferenceChange() {
		if (!reduceMotion.matches) return;
		if (frame) cancelAnimationFrame(frame);
		frame = 0;
		if (applied) clear();
	}

	window.addEventListener('scroll', onScroll, { passive: true });
	reduceMotion.addEventListener('change', onPreferenceChange);

	return {
		destroy() {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener('scroll', onScroll);
			reduceMotion.removeEventListener('change', onPreferenceChange);
			if (applied) clear();
			svg.remove();
		}
	};
};
