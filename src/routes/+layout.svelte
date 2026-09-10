<script lang="ts">
	import Navbar from '$lib/components/navbar.svelte';
	import { scrollMotionBlur } from '$lib/actions/scrollMotionBlur';
	import { footnoteTooltip } from '$lib/actions/footnoteTooltip';
	import { smoothScroll } from '$lib/actions/smoothScroll';
	import { tiltLight } from '$lib/actions/tiltLight';
	import '../app.css';
	let { children } = $props();
</script>

<!--
	각주 말풍선은 visibility: hidden 상태에서도 레이아웃을 차지하기 때문에,
	줄 끝에 붙은 각주가 문서 전체에 가로 스크롤을 만들어냈다. clip은 hidden과
	달리 스크롤 컨테이너를 만들지 않아 세로 스크롤에는 영향이 없다. html/body가
	아닌 이 래퍼에 거는 이유는 루트 요소의 overflow가 뷰포트로 전파되기 때문이다.
-->
<div class="overflow-x-clip" use:scrollMotionBlur use:footnoteTooltip use:smoothScroll use:tiltLight>
	<!--
		기울기 센서가 켜지면 .float-layer가 화면 크기로 고정된 판이 되고, 판 전체가
		기운다. 내용(.float-content)은 판 안에서 스크롤 위치만큼 끌어올려진다.
		센서가 없으면 둘 다 평범한 블록이라 아무것도 달라지지 않는다.
	-->
	<div class="float-layer">
		<div class="float-content">
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
	<!-- 판이 문서 흐름에서 빠진 동안 문서 높이를 대신 채워, 브라우저가 평소처럼 스크롤하게 한다. -->
	<div class="float-spacer" aria-hidden="true"></div>
</div>
