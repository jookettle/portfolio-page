<script lang="ts">
	import { base } from '$app/paths';
	export let data: { post: { metadata: { title: string; date: string; image?: string }; titleHtml: string; content: string } };
</script>

<svelte:head>
	<title>{data.post.metadata.title}</title>
</svelte:head>

<article class="p-4 max-w-2xl mx-auto leading-relaxed">
	{#if data.post.metadata.image}
		<img
			src={data.post.metadata.image.startsWith('/') ? `${base}${data.post.metadata.image}` : data.post.metadata.image}
			alt={`${data.post.metadata.title} header`}
			class="rounded-2xl header-image w-full h-48 object-cover object-center"
		/>
	{/if}
	<h1 class="text-4xl font-black py-4">{@html data.post.titleHtml}</h1>
	<p><small>{data.post.metadata.date}</small></p>
	<div class="markdown-body mt-6">{@html data.post.content}</div>
</article>