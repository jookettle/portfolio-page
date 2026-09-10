import type { Action } from 'svelte/action';

/** 말풍선과 화면 가장자리 사이에 최소한으로 남겨둘 여백(px). */
const MARGIN = 8;

/**
 * 각주 말풍선이 화면 밖으로 밀려나지 않도록 위치를 보정하는 액션.
 *
 * 말풍선은 각주 위치를 기준으로 가운데 정렬되기 때문에, 줄 끝에 붙은 각주는
 * 말풍선의 절반이 화면 밖으로 나간다. 넘친 만큼을 --fn-shift로 되밀어 넣고,
 * 꼬리는 반대로 같은 양만큼 옮겨서 계속 각주를 가리키게 한다.
 *
 * 각주는 마크다운에서 생성된 HTML 안에 있어 개별적으로 액션을 걸 수 없으므로,
 * 상위 요소 한 곳에서 이벤트를 위임받아 처리한다.
 */
export const footnoteTooltip: Action<HTMLElement> = (node) => {
	function place(marker: Element) {
		const tip = marker.querySelector<HTMLElement>('.fn-tooltip');
		if (!tip) return;

		// transform에는 트랜지션이 걸려 있어서, 값을 초기화한 뒤 곧바로
		// getBoundingClientRect를 읽으면 이전 위치에서 이동하는 중간값이 잡힌다.
		// 그래서 실제 위치 대신 기하학적으로 계산한다. offsetWidth는 레이아웃
		// 폭이라 transform의 영향을 받지 않는다.
		const markerRect = marker.getBoundingClientRect();
		const width = tip.offsetWidth;
		const limit = document.documentElement.clientWidth;

		// 보정이 없을 때 말풍선이 놓이는 자리(각주 중심 기준 가운데 정렬).
		const left = markerRect.left + markerRect.width / 2 - width / 2;
		const right = left + width;

		let shift = 0;
		if (right > limit - MARGIN) shift = limit - MARGIN - right;
		else if (left < MARGIN) shift = MARGIN - left;

		tip.style.setProperty('--fn-shift', `${Math.round(shift)}px`);
	}

	function onEnter(event: Event) {
		const marker = (event.target as Element | null)?.closest?.('.fn-marker');
		if (marker) place(marker);
	}

	// visibility: hidden 상태에서도 레이아웃은 잡혀 있으므로 표시 전에 측정할 수 있다.
	node.addEventListener('pointerover', onEnter);
	node.addEventListener('focusin', onEnter);

	return {
		destroy() {
			node.removeEventListener('pointerover', onEnter);
			node.removeEventListener('focusin', onEnter);
		}
	};
};
