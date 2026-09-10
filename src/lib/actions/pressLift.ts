import type { Action } from 'svelte/action';

/** 들어 올렸을 때 커지는 비율. */
const LIFT_SCALE = 0.045;
/** 누른 쪽이 손가락을 향해 들리는 최대 각도(도). */
const MAX_TILT = 7;
/** 카드 자체의 원근 거리(px). */
const CARD_PERSPECTIVE = 700;
/**
 * 스프링 상수. 감쇠를 임계값보다 약하게 잡아(감쇠비 약 0.56) 누를 때 살짝
 * 솟았다가 자리 잡고, 뗄 때는 한 번 튕기며 내려앉는다.
 */
const STIFFNESS = 320;
const DAMPING = 20;
/** 이보다 작게 움직이면 멈춘 것으로 본다. */
const SETTLE = 0.002;

interface Axis {
	value: number;
	velocity: number;
	target: number;
}

interface Spring {
	el: HTMLElement;
	lift: Axis;
	rx: Axis;
	ry: Axis;
	/** 누른 자리(카드 기준 %). 빛이 여기서 번진다. */
	fingerX: number;
	fingerY: number;
	/** 손을 뗀 순간의 전체 광원 위치(%). 내려앉는 동안 빛을 이리로 돌려보낸다. */
	homeX: number | null;
	homeY: number | null;
}

const axis = (): Axis => ({ value: 0, velocity: 0, target: 0 });
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function stepAxis(a: Axis, dt: number) {
	const accel = STIFFNESS * (a.target - a.value) - DAMPING * a.velocity;
	a.velocity += accel * dt;
	a.value += a.velocity * dt;
}

const isSettled = (a: Axis) =>
	Math.abs(a.target - a.value) < SETTLE && Math.abs(a.velocity) < SETTLE;

/**
 * 손가락이 닿는 순간 카드가 판에서 떨어져, 누른 쪽이 손가락을 향해 들리며
 * 떠오른다. 떼면 스프링처럼 튕기며 내려앉는다.
 *
 * 폰은 손가락이 닿기 전에는 손을 알아챌 방법이 없어서, 닿는 순간이 받을 수 있는
 * 가장 이른 신호다. 권한이 필요 없고 모든 터치 기기에서 동작한다. 마우스에는
 * 반응하지 않아 데스크톱은 그대로다.
 *
 * 카드들은 마크다운과 여러 페이지에 흩어져 있으므로 상위 요소 한 곳에서
 * 이벤트를 위임받는다. 탭은 평소처럼 링크로 이동한다.
 */
export const pressLift: Action<HTMLElement> = (node) => {
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const springs = new Map<HTMLElement, Spring>();
	let pressed: { el: HTMLElement; pointerId: number } | null = null;
	let frame = 0;
	let last = 0;

	/** 누른 곳에서 들어 올릴 카드를 찾는다. 포스트 카드는 제목을 눌러도 사진이 뜬다. */
	function findCard(target: EventTarget | null): HTMLElement | null {
		if (!(target instanceof Element) || !node.contains(target)) return null;
		const direct = target.closest<HTMLElement>('.lit, .lit-edge');
		if (direct) return direct;
		return target.closest('a')?.querySelector<HTMLElement>('.lit, .lit-edge') ?? null;
	}

	/** 누른 쪽이 손가락을 향해 들리도록 목표 각도를 정한다. */
	function aim(s: Spring, clientX: number, clientY: number) {
		const r = s.el.getBoundingClientRect();
		const px = clamp(((clientX - r.left) / r.width) * 2 - 1, -1, 1);
		const py = clamp(((clientY - r.top) / r.height) * 2 - 1, -1, 1);
		// CSS에서 rotateY가 양수면 오른쪽이, rotateX가 양수면 위쪽이 멀어진다.
		// 누른 쪽을 가깝게 하려면 둘 다 반대로 돌린다.
		s.ry.target = -px * MAX_TILT;
		s.rx.target = py * MAX_TILT;
		s.fingerX = ((px + 1) / 2) * 100;
		s.fingerY = ((py + 1) / 2) * 100;
	}

	function write(s: Spring) {
		const lift = s.lift.value;
		// 튕기며 내려앉을 때 잠깐 음수가 되는데, 그림자 흐림은 음수가 되면 규칙
		// 전체가 무효가 되어 그림자가 깜빡 사라진다. 그래서 0 아래로는 자른다.
		s.el.style.setProperty('--lift', Math.max(0, lift).toFixed(3));
		s.el.style.setProperty(
			'--lift-transform',
			`perspective(${CARD_PERSPECTIVE}px) rotateX(${s.rx.value.toFixed(2)}deg) ` +
				`rotateY(${s.ry.value.toFixed(2)}deg) scale(${(1 + lift * LIFT_SCALE).toFixed(4)})`
		);

		// 누르는 동안은 손가락 자리에서, 내려앉는 동안은 전체 광원 쪽으로 돌아가며 빛난다.
		// 그렇지 않으면 다 내려앉는 순간 빛이 손가락 자리에서 원래 자리로 툭 튄다.
		const t = clamp(lift, 0, 1);
		const lx = s.homeX === null ? s.fingerX : lerp(s.homeX, s.fingerX, t);
		const ly = s.homeY === null ? s.fingerY : lerp(s.homeY, s.fingerY, t);
		s.el.style.setProperty('--lx', `${lx.toFixed(1)}%`);
		s.el.style.setProperty('--ly', `${ly.toFixed(1)}%`);
	}

	function clear(s: Spring) {
		for (const name of ['--lift', '--lift-transform', '--lx', '--ly']) {
			s.el.style.removeProperty(name);
		}
		delete s.el.dataset.lift;
	}

	function loop(now: number) {
		// 탭이 멈췄다 돌아오면 dt가 커져 스프링이 폭주하므로 한 프레임을 넘기지 않는다.
		const dt = Math.min((now - last) / 1000, 1 / 30);
		last = now;

		for (const s of springs.values()) {
			stepAxis(s.lift, dt);
			stepAxis(s.rx, dt);
			stepAxis(s.ry, dt);

			const resting =
				s.lift.target === 0 && isSettled(s.lift) && isSettled(s.rx) && isSettled(s.ry);
			// 탭해서 페이지를 옮기면 카드가 사라진다. 그런 카드도 정리한다.
			if (resting || !s.el.isConnected) {
				clear(s);
				springs.delete(s.el);
				continue;
			}
			write(s);
		}

		frame = springs.size ? requestAnimationFrame(loop) : 0;
	}

	function start() {
		if (frame) return;
		last = performance.now();
		frame = requestAnimationFrame(loop);
	}

	function release() {
		if (!pressed) return;
		const s = springs.get(pressed.el);
		if (s) {
			s.lift.target = 0;
			s.rx.target = 0;
			s.ry.target = 0;
			// 기울기 효과가 켜져 있으면 전체 광원 위치로 빛을 돌려보낸다.
			const home = getComputedStyle(node);
			const hx = parseFloat(home.getPropertyValue('--lx'));
			const hy = parseFloat(home.getPropertyValue('--ly'));
			s.homeX = Number.isFinite(hx) ? hx : null;
			s.homeY = Number.isFinite(hy) ? hy : null;
		}
		pressed = null;
		start();
	}

	function onDown(event: PointerEvent) {
		if (event.pointerType === 'mouse' || reduceMotion.matches) return;
		const el = findCard(event.target);
		if (!el) return;
		if (pressed) release();

		let s = springs.get(el);
		if (!s) {
			s = {
				el,
				lift: axis(),
				rx: axis(),
				ry: axis(),
				fingerX: 50,
				fingerY: 50,
				homeX: null,
				homeY: null
			};
			springs.set(el, s);
		}
		s.lift.target = 1;
		s.homeX = null;
		s.homeY = null;
		aim(s, event.clientX, event.clientY);
		el.dataset.lift = '';
		pressed = { el, pointerId: event.pointerId };
		start();
	}

	function onMove(event: PointerEvent) {
		if (!pressed || event.pointerId !== pressed.pointerId) return;
		const s = springs.get(pressed.el);
		if (s) aim(s, event.clientX, event.clientY);
	}

	// 스크롤로 이어지면 브라우저가 pointercancel을 보내므로 그때도 내려놓는다.
	function onEnd(event: PointerEvent) {
		if (pressed && event.pointerId === pressed.pointerId) release();
	}

	node.addEventListener('pointerdown', onDown);
	window.addEventListener('pointermove', onMove, { passive: true });
	window.addEventListener('pointerup', onEnd);
	window.addEventListener('pointercancel', onEnd);

	return {
		destroy() {
			if (frame) cancelAnimationFrame(frame);
			for (const s of springs.values()) clear(s);
			springs.clear();
			node.removeEventListener('pointerdown', onDown);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onEnd);
			window.removeEventListener('pointercancel', onEnd);
		}
	};
};
