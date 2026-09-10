<script lang="ts">
	import { base } from '$app/paths';
	import LightToggle from './light-toggle.svelte';
</script>

<div class="flex select-none items-center justify-between gap-3 py-4">
	<a href={`${base}/`} class="text-2xl font-black">JJ:P</a>
	<LightToggle />
</div>
