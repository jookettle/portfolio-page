<script lang="ts">
	export let data: { posts: { slug: string; metadata: { title: string; date: string } }[] };
</script>

<svelte:head>
	<title>Blog</title>
</svelte:head>

<h1>블로그</h1>
<ul>
	{#each data.posts as post}
		<li>
			<a href={`/blog/${post.slug}`}>{post.metadata.title}</a>
			<span> - {post.metadata.date}</span>
		</li>
	{/each}
</ul>
