<script lang="ts">
	import { applyFootnotes } from '$lib/blog';
	import { base } from '$app/paths';
	export let data: {
		posts: {
			slug: string;
			metadata: {
				title: string;
				date: string;
				description?: string;
				image?: string;
				footnotes?: string[];
			};
		}[];
	};
</script>

<svelte:head>
	<title>Jinpyo Joo // Blog</title>
	<meta name="description" content="글 목록" />
</svelte:head>

<div class="w-full px-4 sm:px-6 lg:px-8">
	<section class="border-b border-zinc-200 py-8">
		<h1 class="text-3xl font-black tracking-tight">Blog</h1>
		<p class="mt-0.5 text-sm text-zinc-500">작업하며 남긴 기록들</p>
	</section>

	<section class="py-8">
		{#if data.posts && data.posts.length}
			{@const pageCounter = { n: 1 }}
			<ul class="divide-y divide-zinc-200">
				{#each data.posts as post (post.slug)}
					{@const cardIdx = { n: 0 }}
					<li class="group">
						<a href={`${base}/blog/${post.slug}`} class="flex items-center gap-4 py-5">
							<div
								class="lit hidden h-20 w-28 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 sm:block"
							>
								{#if post.metadata.image}
									<img
										src={post.metadata.image.startsWith('/')
											? `${base}${post.metadata.image}`
											: post.metadata.image}
										alt={post.metadata.title}
										class="h-full w-full object-cover object-center"
									/>
								{/if}
							</div>
							<div class="min-w-0">
								<p class="text-lg font-black group-hover:underline">
									{@html applyFootnotes(
										post.metadata.title,
										post.metadata.footnotes,
										pageCounter,
										cardIdx
									)}
								</p>
								{#if post.metadata.description}
									<p class="mt-0.5 text-sm text-zinc-700">
										{@html applyFootnotes(
											post.metadata.description,
											post.metadata.footnotes,
											pageCounter,
											cardIdx
										)}
									</p>
								{/if}
								<p class="mt-1 text-xs text-zinc-400">{post.metadata.date}</p>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-sm text-zinc-500">포스트가 없습니다.</p>
		{/if}
	</section>
</div>
