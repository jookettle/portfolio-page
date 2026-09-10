<script lang="ts">
	import type { Snapshot } from '@sveltejs/kit';
	import { afterNavigate } from '$app/navigation';
	import Navbar from '$lib/components/navbar.svelte';
	import { scrollMotionBlur } from '$lib/actions/scrollMotionBlur';
	import { footnoteTooltip } from '$lib/actions/footnoteTooltip';
	import { smoothScroll } from '$lib/actions/smoothScroll';
	import { tiltLight } from '$lib/actions/tiltLight';
	import { pressLift } from '$lib/actions/pressLift';
	import { reflectedGlow } from '$lib/actions/reflectedGlow';
	import { longPressGuard } from '$lib/actions/longPressGuard';
	import '../app.css';
	let { children } = $props();

	let scroller: HTMLElement | undefined = $state();

	/*
	 * 판 모드에서는 문서 대신 판 안의 내용(.float-content)이 스크롤된다. SvelteKit은
	 * 문서의 스크롤 위치만 되돌려 주므로 판의 스크롤 위치는 여기서 직접 챙긴다.
	 */
	const inPane = () => !!scroller?.closest('.tilt-active');

	// 뒤로·앞으로 가기 때 원래 보던 위치로 돌려놓는다.
	export const snapshot: Snapshot<number> = {
		capture: () => scroller?.scrollTop ?? 0,
		restore: (y) => {
			if (scroller && inPane()) scroller.scrollTop = y;
		}
	};

	// 새 페이지는 맨 위에서 시작한다. 뒤로·앞으로 가기는 위의 snapshot이 맡는다.
	afterNavigate(({ type }) => {
		if (type !== 'popstate' && scroller && inPane()) scroller.scrollTop = 0;
	});
</script>

<!--
	각주 말풍선은 visibility: hidden 상태에서도 레이아웃을 차지하기 때문에,
	줄 끝에 붙은 각주가 문서 전체에 가로 스크롤을 만들어냈다. clip은 hidden과
	달리 스크롤 컨테이너를 만들지 않아 세로 스크롤에는 영향이 없다. html/body가
	아닌 이 래퍼에 거는 이유는 루트 요소의 overflow가 뷰포트로 전파되기 때문이다.
-->
<div class="overflow-x-clip" use:scrollMotionBlur use:footnoteTooltip use:smoothScroll use:tiltLight use:pressLift use:reflectedGlow use:longPressGuard>
	<!--
		기울기 센서가 켜지면 .float-layer가 화면 크기로 고정된 판이 되고, 판 전체가
		기운다. 내용(.float-content)은 판 안에서 브라우저의 기본 스크롤로 움직인다.
		센서가 없으면 둘 다 평범한 블록이라 아무것도 달라지지 않는다.
	-->
	<div class="float-layer">
		<div class="float-content" bind:this={scroller}>
			<div class="max-w-5xl mx-auto px-4">
				<Navbar/>
				{@render children()}
			</div>
			<footer>
				<div class="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-zinc-800">
					<p>© {new Date().getFullYear()} Jinpyo Joo. All rights reserved.</p>
				</div>
			</footer>
		</div>
	</div>
</div>
