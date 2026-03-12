<script lang="ts">
	import { applyFootnotes } from '$lib/blog';
	export let data: {
		posts: { slug: string; metadata: { title: string; date: string; description: string; image?: string; footnotes?: string[]; visible?: boolean } }[];
	};

	function marquee(node: HTMLElement) {
		node.style.whiteSpace = 'nowrap';
		requestAnimationFrame(() => {
			const overflow = node.scrollWidth - node.offsetWidth;
			if (overflow > 0) {
				node.style.setProperty('--marquee-dist', `-${overflow}px`);
				node.classList.add('marquee-active');
			} else {
				node.style.whiteSpace = '';
			}
		});
	}
</script>

<svelte:head>
	<title>Jinpyo Joo // Projects</title>
	<meta name="description" content="A stripped-down layout with no design flair." />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="w-full px-4 sm:px-6 lg:px-8">

<!-- 자기소개 섹션 -->
<section class="py-8 border-b border-zinc-200 mb-8">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
		<!-- 좌측: 소개 + 링크 -->
		<div>
			<h1 class="text-3xl font-black tracking-tight">Jinpyo Joo</h1>
			<p class="text-zinc-500 text-sm mt-0.5">Full-stack Developer&nbsp;·&nbsp; Web Design</p>
			<p class="mt-3 text-zinc-700 leading-relaxed text-sm">
				디스코드 챗봇부터 웹 서비스까지, 사용자의 실제 경험을 개선하는 데 관심 많은 개발자입니다.
				문제를 찾고, 그것을 기술로 풀어내는 과정을 좋아합니다.
			</p>
			<div class="flex flex-wrap gap-2 mt-4">
				<span class="px-2 py-0.5 bg-zinc-100 rounded-full text-xs font-medium text-zinc-700">TypeScript</span>
				<span class="px-2 py-0.5 bg-zinc-100 rounded-full text-xs font-medium text-zinc-700">Node.js</span>
				<span class="px-2 py-0.5 bg-zinc-100 rounded-full text-xs font-medium text-zinc-700">SvelteKit</span>
				<span class="px-2 py-0.5 bg-zinc-100 rounded-full text-xs font-medium text-zinc-700">Docker</span>
				<span class="px-2 py-0.5 bg-zinc-100 rounded-full text-xs font-medium text-zinc-700">PostgreSQL</span>
			</div>

			<div class="grid grid-cols-2 gap-2 mt-6">
				<!-- GitHub -->
				<a href="https://github.com/jookettle" target="_blank" rel="noopener noreferrer"
					class="group flex items-center gap-2 p-3 rounded-xl border border-zinc-200 hover:border-zinc-400 transition-colors">
					<div class="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
						<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
						</svg>
					</div>
					<div class="min-w-0">
						<p class="text-xs font-semibold group-hover:underline">GitHub</p>
						<p class="text-xs text-zinc-400 truncate">jookettle</p>
					</div>
				</a>
				<!-- LinkedIn -->
				<a href="https://www.linkedin.com/in/aiaikr/" target="_blank" rel="noopener noreferrer"
					class="group flex items-center gap-2 p-3 rounded-xl border border-zinc-200 hover:border-zinc-400 transition-colors">
					<div class="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
						<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
						</svg>
					</div>
					<div class="min-w-0">
						<p class="text-xs font-semibold group-hover:underline">LinkedIn</p>
						<p class="text-xs text-zinc-400 truncate">aiaikr</p>
					</div>
				</a>
				<!-- Email -->
				<a href="mailto:root@ai.ai.kr"
					class="group flex items-center gap-2 p-3 rounded-xl border border-zinc-200 hover:border-zinc-400 transition-colors">
					<div class="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
						<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
						</svg>
					</div>
					<div class="min-w-0">
						<p class="text-xs font-semibold group-hover:underline">Email</p>
						<p class="text-xs text-zinc-400 truncate">root@ai.ai.kr</p>
					</div>
				</a>
				<!-- ORCID -->
				<a href="https://orcid.org/0009-0003-3814-9206" target="_blank" rel="noopener noreferrer"
					class="group flex items-center gap-2 p-3 rounded-xl border border-zinc-200 hover:border-zinc-400 transition-colors">
					<div class="w-7 h-7 rounded-lg bg-[#A6CE39] flex items-center justify-center shrink-0">
						<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 3.872-2.862 3.872-3.722 0-2.016-1.284-3.722-3.872-3.722h-2.297z"/>
						</svg>
					</div>
					<div class="min-w-0">
						<p class="text-xs font-semibold group-hover:underline">ORCID</p>
						<p class="text-xs text-zinc-400 truncate">0009-0003-3814-9206</p>
					</div>
				</a>
			</div>
		</div>

		<!-- 우측: 경력 -->
		<div class="w-full text-right">
			<h2 class="text-lg font-semibold mb-4">History</h2>
			<div class="space-y-3">
				<!-- Machobot -->
				<div class="flex gap-3 flex-row-reverse">
					<div class="relative flex flex-col items-center pt-1">
						<div class="w-2 h-2 rounded-full bg-zinc-400 relative z-[1]"></div>
						<div class="w-0.5 h-14 bg-zinc-300 mt-2"></div>
					</div>
					<div class="pb-3">
						<div class="flex items-center justify-between gap-2">
							<h3 class="font-semibold text-sm text-zinc-900">마쵸봇</h3>
							<p class="text-xs text-zinc-500">2022 -</p>
						</div>
						<p class="text-xs text-zinc-600">Product Director / Backend</p>
					</div>
				</div>
				<!-- Furpic -->
				<div class="flex gap-3 flex-row-reverse">
					<div class="relative flex flex-col items-center pt-1">
						<div class="w-2 h-2 rounded-full bg-zinc-400 relative z-[1]"></div>
						<div class="w-0.5 h-14 bg-zinc-300 mt-2"></div>
					</div>
					<div class="pb-3">
						<div class="flex items-center justify-between gap-2">
							<h3 class="font-semibold text-sm text-zinc-900">Furpic</h3>
							<p class="text-xs text-zinc-500">2024 -</p>
						</div>
						<p class="text-xs text-zinc-600">Web Designer / Frontend</p>
					</div>
				</div>
				<!-- freelencer -->
				<div class="flex gap-3 flex-row-reverse">
					<div class="relative flex flex-col items-center pt-1">
						<div class="w-2 h-2 rounded-full bg-zinc-400 relative z-[1]"></div>
						<div class="w-0.5 h-14 bg-zinc-300 mt-2"></div>
					</div>
					<div class="pb-3">
						<div class="flex items-center justify-between gap-2">
							<h3 class="font-semibold text-sm text-zinc-900">프리랜서 개발자</h3>
							<p class="text-xs text-zinc-500">2024 -</p>
						</div>
						<p class="text-xs text-zinc-600">Web Designer / Full-stack Developer</p>
					</div>
				</div>
				<!-- ZeroSUM -->
				<div class="flex gap-3 flex-row-reverse">
					<div class="relative flex flex-col items-center pt-1">
						<div class="w-2 h-2 rounded-full bg-zinc-400 relative z-[1]"></div>
						<div class="w-0.5 h-14 bg-zinc-300 mt-2"></div>
					</div>
					<div class="pb-3">
						<div class="flex items-center justify-between gap-2">
							<h3 class="font-semibold text-sm text-zinc-900">ZeroSUM</h3>
							<p class="text-xs text-zinc-500">2026 -</p>
						</div>
						<p class="text-xs text-zinc-600">Leader (학교 개발 동아리)</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<section>
	<h2 class="text-2xl font-light py-4">Posts</h2>
</section>
<section>
	{#if data.posts && data.posts.length}
		{@const pageCounter = { n: 1 }}
		<ul class="grid grid-cols-1 gap-6 sm:grid-cols-3">
			{#each data.posts as post}
				{@const cardIdx = { n: 0 }}
				<li class="group">
					<a href={`/blog/${post.slug}` }>
						<div class="border border-zinc-200 h-40 w-full overflow-hidden rounded-2xl">
							{#if post.metadata.image}
								<img
									src={post.metadata.image}
									alt={post.metadata.title}
									class="header-image h-full w-full object-cover object-center"
								/>
							{/if}
						</div>
						<div class="py-4">
						<div class="overflow-hidden">
							<p class="text-xl font-black group-hover:underline" use:marquee>
								{@html applyFootnotes(post.metadata.title, post.metadata.footnotes, pageCounter, cardIdx)}
							</p>
						</div>
							<p class="block text-md font-md group-hover:underline">
								{@html applyFootnotes(post.metadata.description, post.metadata.footnotes, pageCounter, cardIdx)}
							</p>
							<p class="text-gray-500">{post.metadata.date}</p>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p>포스트가 없습니다.</p>
	{/if}
</section>

</div>
