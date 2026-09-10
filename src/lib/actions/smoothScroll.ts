import type { Action } from 'svelte/action';

export interface SmoothScrollOptions {
	/**
	 * 매 프레임 목표 지점까지 남은 거리 중 얼마를 따라갈지(0~1).
	 * 낮출수록 여운이 길어지고, 높일수록 즉각적이다.
	 */
	ease?: number;
	/** 휠 입력량에 곱하는 배수. */
	multiplier?: number;
}

/** 한 줄 단위(deltaMode 1)로 오는 휠 입력을 px로 환산할 때 쓰는 값. */
const LINE_HEIGHT = 16;
/** 이 거리 안으로 들어오면 목표 지점에 붙이고 루프를 끝낸다. */
const SETTLE = 0.5;

/**
 * 휠 입력을 받아 목표 지점까지 부드럽게 따라가는 관성 스크롤.
 *
 * 브라우저 기본 스크롤은 휠 한 번에 즉시 점프하기 때문에 딱딱하게 느껴진다.
 * 목표 위치를 따로 두고 매 프레임 그쪽으로 일정 비율만큼 다가가면, 멈출 때
 * 자연스럽게 감속하는 느낌이 생긴다.
 *
 * 글자는 멈춘 순간 곧바로 선명해져야 하므로 정착 판정을 짧게 두었고,
 * 스크롤 자체에는 어떤 흐림 효과도 주지 않는다.
 *
 * 터치 환경은 OS가 이미 관성을 처리하므로 건드리지 않는다. 휠 이벤트는
 * 터치 스크롤에서 발생하지 않기 때문에 자연히 기본 동작으로 남는다.
 */
export const smoothScroll: Action<HTMLElement, SmoothScrollOptions | undefined> = (
	node,
	options
) => {
	const ease = options?.ease ?? 0.2;
	const multiplier = options?.multiplier ?? 1;

	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

	let target = window.scrollY;
	let frame = 0;

	function maxScroll() {
		return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
	}

	/**
	 * 코드 블록처럼 자체 스크롤을 가진 요소 위에서는 기본 동작에 맡긴다.
	 * 세로로 실제 스크롤할 여지가 있는 경우에만 해당한다.
	 */
	function insideOwnScroller(start: EventTarget | null) {
		let el = start instanceof Element ? start : null;
		while (el && el !== node) {
			if (el.scrollHeight > el.clientHeight) {
				const overflowY = getComputedStyle(el).overflowY;
				if (overflowY === 'auto' || overflowY === 'scroll') return true;
			}
			el = el.parentElement;
		}
		return false;
	}

	function tick() {
		const current = window.scrollY;
		const diff = target - current;

		if (Math.abs(diff) < SETTLE) {
			window.scrollTo(0, target);
			frame = 0;
			return;
		}

		window.scrollTo(0, current + diff * ease);
		frame = requestAnimationFrame(tick);
	}

	function onWheel(event: WheelEvent) {
		if (reduceMotion.matches) return;
		// 확대/축소 제스처는 스크롤이 아니다.
		if (event.ctrlKey) return;
		// 가로가 우세한 입력과 shift+휠은 코드 블록처럼 가로로 스크롤되는
		// 영역의 몫이다. 여기서 preventDefault하면 그쪽이 죽는다.
		if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
		if (insideOwnScroller(event.target)) return;

		let delta = event.deltaY;
		if (event.deltaMode === 1) delta *= LINE_HEIGHT;
		else if (event.deltaMode === 2) delta *= window.innerHeight;

		event.preventDefault();

		// 루프가 멈춰 있었다면 그동안 다른 방법으로 움직였을 수 있으니 기준을 다시 잡는다.
		if (!frame) target = window.scrollY;
		target = Math.min(Math.max(target + delta * multiplier, 0), maxScroll());

		if (!frame) frame = requestAnimationFrame(tick);
	}

	/** 키보드, 스크롤바 드래그, 앵커 이동 등 휠이 아닌 입력에는 제어를 넘긴다. */
	function release() {
		if (frame) cancelAnimationFrame(frame);
		frame = 0;
		target = window.scrollY;
	}

	window.addEventListener('wheel', onWheel, { passive: false });
	window.addEventListener('keydown', release);
	window.addEventListener('pointerdown', release);
	window.addEventListener('resize', release);

	return {
		destroy() {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener('wheel', onWheel);
			window.removeEventListener('keydown', release);
			window.removeEventListener('pointerdown', release);
			window.removeEventListener('resize', release);
		}
	};
};
