<script lang="ts">
	import { base } from '$app/paths';
	export let data: { posts: { slug: string; metadata: { title: string; date: string } }[] };
</script>

<svelte:head>
	<title>Blog</title>
</svelte:head>

<h1>블로그</h1>
<ul>
	{#each data.posts as post}
		<li>
			<a href={`${base}/blog/${post.slug}`}>{post.metadata.title}</a>
			<span> - {post.metadata.date}</span>
		</li>
	{/each}
</ul>
