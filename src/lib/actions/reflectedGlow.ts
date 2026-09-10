import type { Action } from 'svelte/action';

type RGB = [number, number, number];

/**
 * 이보다 채도가 낮은 색은 반사빛으로 쓰지 않는다. 검정·회색이 번지면
 * 결국 그림자로 보이기 때문이다.
 */
const MIN_SATURATION = 0.25;
/** 사진의 대표색을 뽑을 때 줄여 그리는 크기(px). 색만 보면 되므로 작아도 된다. */
const SAMPLE = 24;
/** 이보다 어두운 픽셀은 대표색을 고를 때 뺀다. */
const MIN_VALUE = 0.35;
/**
 * 반사빛은 빛이므로 색조는 두고 밝기만 이 값(가장 밝은 채널 기준)으로 맞춘다.
 * 어두운 색이 그대로 번지면 반사빛이 아니라 탁한 그림자로 보이고, 카드마다
 * 밝기가 들쭉날쭉하면 번짐의 세기도 제각각이 된다.
 */
const GLOW_VALUE = 220;

function luminous([r, g, b]: RGB): RGB {
	const max = Math.max(r, g, b) || 1;
	const scale = GLOW_VALUE / max;
	return [r, g, b].map((c) => Math.min(255, Math.round(c * scale))) as RGB;
}

function saturation(r: number, g: number, b: number) {
	const max = Math.max(r, g, b);
	return max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
}

function hue(r: number, g: number, b: number) {
	const max = Math.max(r, g, b);
	const d = max - Math.min(r, g, b);
	if (d === 0) return 0;
	let h: number;
	if (max === r) h = ((g - b) / d) % 6;
	else if (max === g) h = (b - r) / d + 2;
	else h = (r - g) / d + 4;
	return (h * 60 + 360) % 360;
}

/**
 * 어떤 CSS 색 표기든 sRGB 바이트로 바꾼다.
 *
 * Tailwind v4는 팔레트를 oklch()로 정의해서 계산된 배경색도 oklch로 나온다.
 * 문자열을 직접 해석하는 대신 캔버스에 한 점 칠해 읽으면 브라우저가 알아서 바꿔 준다.
 */
function toRgba(ctx: CanvasRenderingContext2D, color: string): [...RGB, number] {
	ctx.clearRect(0, 0, 1, 1);
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, 1, 1);
	const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
	return [r, g, b, a / 255];
}

/** 링크 카드 안에서 색이 있는 배경(아이콘 칸)을 찾는다. */
function accentOf(card: HTMLElement, ctx: CanvasRenderingContext2D): RGB | null {
	for (const el of card.querySelectorAll<HTMLElement>('*')) {
		const [r, g, b, a] = toRgba(ctx, getComputedStyle(el).backgroundColor);
		if (a < 0.5) continue;
		if (saturation(r, g, b) >= MIN_SATURATION) return [r, g, b];
	}
	return null;
}

/**
 * 사진의 대표색.
 *
 * 전체 평균을 내면 여러 색이 섞여 탁한 회갈색이 된다. 그래서 색상환을 12칸으로
 * 나누고, 선명한 픽셀이 가장 많이 모인 칸의 평균을 쓴다.
 */
function dominantOf(img: HTMLImageElement): RGB | null {
	const canvas = document.createElement('canvas');
	canvas.width = SAMPLE;
	canvas.height = SAMPLE;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return null;

	let data: Uint8ClampedArray;
	try {
		ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
		data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
	} catch {
		// 다른 도메인의 사진은 픽셀을 읽을 수 없다.
		return null;
	}

	const buckets = Array.from({ length: 12 }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));
	for (let i = 0; i < data.length; i += 4) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		const s = saturation(r, g, b);
		const v = Math.max(r, g, b) / 255;
		if (s < MIN_SATURATION || v < MIN_VALUE) continue;
		const bucket = buckets[Math.floor(hue(r, g, b) / 30) % 12];
		// 밝은 픽셀에 무게를 더 둔다. 어두운 배경 위의 가는 선처럼 빛나는 부분이
		// 사진의 인상을 만들기 때문이다.
		const weight = s * v * v;
		bucket.weight += weight;
		bucket.r += r * weight;
		bucket.g += g * weight;
		bucket.b += b * weight;
	}

	const best = buckets.reduce((a, b) => (b.weight > a.weight ? b : a));
	if (best.weight === 0) return null;
	return [best.r, best.g, best.b].map((c) => Math.round(c / best.weight)) as RGB;
}

/**
 * 카드마다 자기 색을 --glow로 달아 준다. 이 색이 카드 아래로 은은하게 번져,
 * 검은 그림자 대신 반사된 빛처럼 보인다.
 *
 * 링크 카드는 아이콘 칸의 색을, 사진은 대표색을 쓴다. 색을 못 찾으면(검은
 * 아이콘 등) 아무것도 달지 않고, CSS가 지금 빛의 색이 섞인 번짐으로 대신한다.
 * 페이지를 옮기면 새 카드가 생기므로 그때마다 다시 훑는다.
 */
export const reflectedGlow: Action<HTMLElement> = (node) => {
	const done = new WeakSet<Element>();
	const colorProbe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });

	function paint(el: HTMLElement, rgb: RGB) {
		el.style.setProperty('--glow', luminous(rgb).join(', '));
	}

	function scan() {
		for (const card of node.querySelectorAll<HTMLElement>('.lit-edge')) {
			if (done.has(card) || !colorProbe) continue;
			done.add(card);
			const rgb = accentOf(card, colorProbe);
			if (rgb) paint(card, rgb);
		}

		for (const card of node.querySelectorAll<HTMLElement>('.lit')) {
			if (done.has(card)) continue;
			const img = card.querySelector('img');
			if (!img) continue;
			done.add(card);
			const apply = () => {
				const rgb = dominantOf(img);
				if (rgb) paint(card, rgb);
			};
			if (img.complete && img.naturalWidth) apply();
			else img.addEventListener('load', apply, { once: true });
		}
	}

	scan();
	const observer = new MutationObserver(scan);
	observer.observe(node, { childList: true, subtree: true });

	return {
		destroy() {
			observer.disconnect();
		}
	};
};
