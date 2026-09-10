<script lang="ts">
	import { requestTiltPermission } from '$lib/actions/tiltLight';

	// 센서 값이 실제로 안 들어오고, 물어볼 수 있는 환경일 때만 나타난다.
	// 데스크톱이나 센서 없는 기기에서는 끝까지 보이지 않는다.
	let needed = $state(false);
	let asking = $state(false);
	let refused = $state(false);

	$effect(() => {
		const show = () => (needed = true);
		window.addEventListener('tiltlight:needspermission', show);
		return () => window.removeEventListener('tiltlight:needspermission', show);
	});

	async function enable() {
		asking = true;
		const granted = await requestTiltPermission();
		asking = false;
		if (granted) needed = false;
		else refused = true;
	}
</script>

{#if needed}
	<button
		onclick={enable}
		disabled={asking}
		class="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-400 disabled:opacity-50"
	>
		{refused ? '기울기 효과 다시 시도' : '기울기 효과 켜기'}
	</button>
{/if}
