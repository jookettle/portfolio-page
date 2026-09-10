import type { Action } from 'svelte/action';

/** 꾹 눌러도 브라우저 메뉴를 띄우지 않을 대상. 글자가 아닌 것들이다. */
const GUARDED = 'img, svg, a, button, .lit, .lit-edge';

/**
 * 안드로이드에서 꾹 눌렀을 때 뜨는 브라우저 메뉴(이미지 저장, 링크 복사 등)를 막는다.
 *
 * 아이폰은 같은 메뉴를 CSS(-webkit-touch-callout)로 막을 수 있지만, 안드로이드
 * 크롬은 꾹 누르면 contextmenu 이벤트를 보내고 그걸로 메뉴를 띄운다.
 *
 * 글자는 막지 않는다. 안드로이드에서는 이 이벤트를 막으면 꾹 눌러 글자를 선택하는
 * 동작까지 함께 멈추기 때문이다. 마우스 우클릭도 막지 않는다. 꾹 누르기는 터치의
 * 동작이고, 데스크톱의 우클릭 메뉴는 그대로 두어야 한다.
 */
export const longPressGuard: Action<HTMLElement> = (node) => {
	// contextmenu 이벤트에는 무엇으로 눌렀는지가 늘 담겨 오지 않아 직전 입력을 기억한다.
	let byTouch = false;

	function onPointerDown(event: PointerEvent) {
		byTouch = event.pointerType !== 'mouse';
	}

	function onContextMenu(event: MouseEvent) {
		if (!byTouch) return;
		const target = event.target instanceof Element ? event.target : null;
		if (target?.closest(GUARDED)) event.preventDefault();
	}

	node.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
	node.addEventListener('contextmenu', onContextMenu);

	return {
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown, { capture: true });
			node.removeEventListener('contextmenu', onContextMenu);
		}
	};
};
