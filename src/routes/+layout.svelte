<script lang="ts">
	import Navbar from '$lib/components/navbar.svelte';
	import '../app.css'
	let { children } = $props()
</script>
<div class="max-w-5xl mx-auto px-4">
	<Navbar/>
	{@render children()}
</div>
<footer>
	<div class="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-zinc-800">
		<p>© {new Date().getFullYear()} Jinpyo Joo. All rights reserved.</p>
	</div>
</footer>