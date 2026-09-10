import type { Action } from 'svelte/action';

/** 가까운 물체: 페이지 위에 떠 있는 카드와 사진. */
const NEAR = '.lit, .lit-edge';
/** 먼 물체: 페이지 표면에 붙어 있는 것들. */
const FAR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, table, figure, footer, span, a, button';
/** 폰을 멈춘 뒤 흐림이 풀리기까지(ms). 왕복하며 기울이는 동안 깜빡이지 않게 한다. */
const LINGER_MS = 450;
/** 흐림이 풀리는 전환 시간(ms). CSS의 transition과 맞춘다. */
const FADE_MS = 300;
/** 우클릭 직후 들어오는 마우스 움직임은 메뉴가 뜨기 전의 것이라 무시한다(ms). */
const MENU_GRACE_MS = 250;

type Depth = 'focus' | 'near' | 'far';

/**
 * 조리개 효과. 우클릭하거나(데스크톱) 폰을 기울여 움직이면, 가까운 물체는 덜
 * 흐려지고 멀수록 더 흐려진다. 아주 미세한 흐림이다.
 *
 * 이 사이트의 깊이는 이미 정해져 있다. 누르고 있는 카드가 가장 가깝고, 그다음이
 * 페이지 위에 떠 있는 카드와 사진, 가장 뒤가 페이지 표면의 글자다. 우클릭한 대상은
 * 초점이 맞아 선명하게 둔다.
 *
 * 흐림은 부모에 걸면 자식이 벗어날 수 없으므로(가까운 카드가 먼 글자와 함께 흐려짐)
 * 잎사귀 쪽 요소에 하나씩 건다. 화면에 보이는 것만, 효과를 켤 때 한 번만 훑는다.
 *
 * 폰에서는 스크롤 움직임에는 반응하지 않는다. 스크롤마다 필터를 거는 일은 앞서
 * 모바일 스크롤을 번쩍이고 끊기게 한 원인이었다.
 */
export const depthOfField: Action<HTMLElement> = (node) => {
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)');

	let marked: HTMLElement[] = [];
	let active = false;
	/**
	 * 무엇이 켰는지. 스크롤·키 입력·마우스 움직임으로 푸는 건 우클릭 메뉴가
	 * 닫혔는지 짐작하는 용도라, 폰의 기울임으로 켜진 흐림에는 쓰지 않는다.
	 * 그러지 않으면 기울이며 스크롤할 때 껐다 켜기를 끝없이 되풀이한다.
	 */
	let source: 'menu' | 'motion' | null = null;
	let openedAt = 0;
	let lingerTimer = 0;
	let cleanupTimer = 0;
	let lastPointer = 'mouse';

	function isVisible(el: Element) {
		const r = el.getBoundingClientRect();
		return r.bottom > 0 && r.top < window.innerHeight && r.width > 0 && r.height > 0;
	}

	/** 우클릭한 곳에서 초점을 맞출 대상을 찾는다. 포스트 카드는 사진에 맞춘다. */
	function focusOf(target: EventTarget | null): HTMLElement | null {
		if (!(target instanceof Element) || !node.contains(target)) return null;
		return (
			target.closest<HTMLElement>(NEAR) ??
			target.closest('a')?.querySelector<HTMLElement>(NEAR) ??
			target.closest<HTMLElement>(FAR)
		);
	}

	function engage(focus: HTMLElement | null, by: 'menu' | 'motion') {
		if (reduceMotion.matches) return;
		clearTimeout(cleanupTimer);
		if (active) return;
		active = true;
		source = by;

		// 되돌리는 중이던 표시가 남아 있으면 먼저 치운다.
		for (const el of marked) delete el.dataset.dof;

		const near = [...node.querySelectorAll<HTMLElement>(NEAR)].filter(isVisible);
		const candidates = [...node.querySelectorAll<HTMLElement>(FAR)].filter(
			(el) =>
				isVisible(el) &&
				// 카드 안의 글자는 카드와 함께 가깝다.
				!el.closest(NEAR) &&
				// 가까운 물체를 품은 요소를 흐리면 그 안의 카드까지 흐려진다.
				!el.querySelector(NEAR) &&
				// 초점을 품은 요소도 마찬가지로 건드리지 않는다.
				!(focus && el !== focus && el.contains(focus))
		);
		// li 안의 p처럼 겹치는 경우 바깥쪽에만 걸어야 흐림이 두 번 먹지 않는다.
		const far = candidates.filter((el) => !candidates.some((o) => o !== el && o.contains(el)));

		const mark = (el: HTMLElement, depth: Depth) => {
			el.dataset.dof = depth;
			marked.push(el);
		};
		marked = [];
		for (const el of far) mark(el, el === focus ? 'focus' : 'far');
		for (const el of near) mark(el, el === focus ? 'focus' : 'near');
	}

	function release() {
		clearTimeout(lingerTimer);
		if (!active) return;
		active = false;
		source = null;

		// 데스크톱은 흐림이 스르르 풀리게 두었다가 표시를 치우고, 폰은 바로 치운다.
		// 폰에서 전환까지 돌리면 수십 개 요소를 매 프레임 다시 그려야 한다.
		if (fineHover.matches) {
			for (const el of marked) el.dataset.dof = 'off';
			const done = marked;
			cleanupTimer = window.setTimeout(() => {
				for (const el of done) if (el.dataset.dof === 'off') delete el.dataset.dof;
			}, FADE_MS);
		} else {
			for (const el of marked) delete el.dataset.dof;
		}
		marked = [];
	}

	/** 우클릭 메뉴로 켜진 흐림만 푼다. */
	function releaseMenu() {
		if (source === 'menu') release();
	}

	// 데스크톱: 우클릭하면 뜨는 메뉴 뒤로 페이지가 흐려지고, 메뉴가 닫히면 풀린다.
	// 오른쪽 버튼을 누르는 순간에도 pointerdown이 먼저 오지만, 그 뒤에 오는
	// contextmenu가 다시 켜므로 문제없다.
	function onPointerDown(event: PointerEvent) {
		lastPointer = event.pointerType;
		releaseMenu();
	}

	function onContextMenu(event: MouseEvent) {
		// 터치의 꾹 누르기는 대상이 아니다.
		if (lastPointer !== 'mouse') return;
		engage(focusOf(event.target), 'menu');
		openedAt = performance.now();
	}

	// 메뉴가 떠 있는 동안 페이지에는 마우스 움직임이 오지 않는다. 다시 오기 시작하면
	// 메뉴가 닫힌 것이다. 닫힌 순간을 알려 주는 이벤트가 따로 없어서 이렇게 짐작한다.
	function onMouseMove() {
		if (source === 'menu' && performance.now() - openedAt > MENU_GRACE_MS) release();
	}

	// 폰: 의도한 기울임이 이어지는 동안 켜 두고, 멈추면 잠시 뒤 푼다.
	function onMotion() {
		engage(null, 'motion');
		if (source !== 'motion') return;
		clearTimeout(lingerTimer);
		lingerTimer = window.setTimeout(release, LINGER_MS);
	}

	node.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
	node.addEventListener('contextmenu', onContextMenu);
	window.addEventListener('mousemove', onMouseMove, { passive: true });
	window.addEventListener('keydown', releaseMenu);
	window.addEventListener('wheel', releaseMenu, { passive: true });
	window.addEventListener('scroll', releaseMenu, { passive: true, capture: true });
	window.addEventListener('blur', releaseMenu);
	window.addEventListener('tiltlight:motion', onMotion);

	return {
		destroy() {
			clearTimeout(lingerTimer);
			clearTimeout(cleanupTimer);
			for (const el of marked) delete el.dataset.dof;
			node.removeEventListener('pointerdown', onPointerDown, { capture: true });
			node.removeEventListener('contextmenu', onContextMenu);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('keydown', releaseMenu);
			window.removeEventListener('wheel', releaseMenu);
			window.removeEventListener('scroll', releaseMenu, { capture: true });
			window.removeEventListener('blur', releaseMenu);
			window.removeEventListener('tiltlight:motion', onMotion);
		}
	};
};
