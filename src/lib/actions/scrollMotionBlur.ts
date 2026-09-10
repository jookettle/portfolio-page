import type { Action } from 'svelte/action';

export interface ScrollMotionBlurOptions {
	/** 블러 상한(px). */
	max?: number;
	/** 스크롤 속도(px/frame) 1당 붙는 블러의 양. */
	sensitivity?: number;
	/** 0~1. 클수록 속도 변화에 즉각 반응하고, 작을수록 여운이 길게 남는다. */
	smoothing?: number;
	/**
	 * 필터를 걸 대상 선택자. 대상이 많을수록 효과는 잘 보이지만 그리는 양도 늘어난다.
	 * 버거우면 'img'로 좁히면 된다.
	 */
	blocks?: string;
}

/** 이 값 아래로 떨어지면 블러를 걷어낸다. */
const MIN_BLUR = 0.15;
/** 멈춘 뒤 이만큼의 프레임이 지나면 rAF 루프를 끊는다. */
const IDLE_FRAMES = 5;
/** 대상 목록을 다시 훑기까지의 프레임 간격. */
const RESCAN_FRAMES = 15;
/**
 * 필터를 걸 블록들. 문서 전체를 한 덩어리로 그리는 대신 이 단위로 나눠 걸면,
 * 화면에 보이는 것만 처리하면 되므로 훨씬 가볍다.
 *
 * 잎사귀 쪽 요소만 넣어야 한다. 중첩 제거가 바깥쪽을 남기는 방식이라
 * section이나 div 같은 큰 컨테이너를 넣으면 전부 하나로 합쳐져, 문서 전체에
 * 필터를 걸던 처음 상태로 되돌아간다.
 */
const BLOCKS =
	'img, p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, table, a, span, figure, button';

/**
 * 스크롤 속도에 따라 세로 모션블러를 거는 액션.
 *
 * 필터는 이미지에만 건다. 페이지 전체를 감싼 요소에 걸면 스크롤하는 동안
 * 매 프레임 문서 전체를 오프스크린 버퍼에 다시 그려야 해서 프레임이 무너진다.
 * 이미지 몇 장은 면적이 작아 부담이 훨씬 적고, 움직임도 사진에서 가장 잘 보인다.
 * 글자에 걸지 않으므로 읽는 데도 방해가 없다.
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
	// 터치 기기에서는 켜지 않는다. 스크롤할 때마다 수십 개 요소에 SVG 필터를 걸었다
	// 떼는 일이 모바일 GPU에는 너무 무겁고, iOS에서는 필터가 붙는 순간 요소가
	// 번쩍인다. 최신 폰에서도 스크롤이 끊기고 화면이 번쩍이던 주된 원인이었다.
	if (window.matchMedia('(pointer: coarse)').matches) return;

	// 쫀득한 스크롤이 프레임당 이동량을 낮추기 때문에, 예전보다 같은 속도감에서
	// 훨씬 작은 값이 나온다. 그만큼 감도를 올려 잡았다.
	const max = options?.max ?? 14;
	const sensitivity = options?.sensitivity ?? 0.4;
	const smoothing = options?.smoothing ?? 0.7;
	const blocks = options?.blocks ?? BLOCKS;

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
	// 문단 한 줄처럼 낮은 블록에서는 퍼센트 영역이 너무 좁아 블러 끝이 잘린다.
	filter.setAttribute('y', '-60%');
	filter.setAttribute('height', '220%');
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
	let sinceScan = 0;
	let applied = false;
	let targets: HTMLElement[] = [];

	/** 화면에 걸쳐 있는 블록만 모은다. 보이지 않는 것에 필터를 걸 이유가 없다. */
	function scan() {
		const vh = window.innerHeight;
		const visible: HTMLElement[] = [];
		for (const el of node.querySelectorAll<HTMLElement>(blocks)) {
			const r = el.getBoundingClientRect();
			if (r.bottom > 0 && r.top < vh && r.width > 0) visible.push(el);
		}
		// li 안의 p처럼 겹치는 경우 바깥쪽에만 걸어야 블러가 두 번 먹지 않는다.
		const next = visible.filter((el) => !visible.some((other) => other !== el && other.contains(el)));

		// 목록에서 빠진 요소에 필터가 남아 있으면 걷어낸다.
		for (const el of targets) if (!next.includes(el)) el.style.filter = '';
		targets = next;
		sinceScan = 0;
	}

	function clearAll() {
		for (const el of targets) el.style.filter = '';
		gaussian.setAttribute('stdDeviation', '0 0');
		blur = 0;
		applied = false;
	}

	function tick() {
		const y = window.scrollY;
		const velocity = Math.abs(y - lastY);
		lastY = y;

		if (sinceScan++ >= RESCAN_FRAMES) scan();

		const target = Math.min(velocity * sensitivity, max);
		blur += (target - blur) * smoothing;

		if (blur > MIN_BLUR) {
			idle = 0;
			gaussian.setAttribute('stdDeviation', `0 ${blur.toFixed(2)}`);
			if (!applied) {
				for (const el of targets) el.style.filter = `url(#${id})`;
				applied = true;
			}
		} else {
			if (applied) clearAll();
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
		scan();
		frame = requestAnimationFrame(tick);
	}

	function onPreferenceChange() {
		if (!reduceMotion.matches) return;
		if (frame) cancelAnimationFrame(frame);
		frame = 0;
		if (applied) clearAll();
	}

	window.addEventListener('scroll', onScroll, { passive: true });
	reduceMotion.addEventListener('change', onPreferenceChange);

	return {
		destroy() {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener('scroll', onScroll);
			reduceMotion.removeEventListener('change', onPreferenceChange);
			if (applied) clearAll();
			svg.remove();
		}
	};
};
