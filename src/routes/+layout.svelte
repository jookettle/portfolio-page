<script lang="ts">
	import Navbar from '$lib/components/navbar.svelte';
	import { scrollMotionBlur } from '$lib/actions/scrollMotionBlur';
	import { footnoteTooltip } from '$lib/actions/footnoteTooltip';
	import { smoothScroll } from '$lib/actions/smoothScroll';
	import '../app.css';
	let { children } = $props();
</script>

<!--
	각주 말풍선은 visibility: hidden 상태에서도 레이아웃을 차지하기 때문에,
	줄 끝에 붙은 각주가 문서 전체에 가로 스크롤을 만들어냈다. clip은 hidden과
	달리 스크롤 컨테이너를 만들지 않아 세로 스크롤에는 영향이 없다. html/body가
	아닌 이 래퍼에 거는 이유는 루트 요소의 overflow가 뷰포트로 전파되기 때문이다.
-->
<div class="overflow-x-clip" use:scrollMotionBlur use:footnoteTooltip use:smoothScroll>
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
