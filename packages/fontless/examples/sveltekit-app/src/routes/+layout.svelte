<script lang="ts">
	import "../app.css"
	import favicon from '$lib/assets/favicon.svg';
	import { preloads } from "fontless/runtime";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#each preloads as attrs}
		<link {...attrs} />
	{/each}
</svelte:head>

{@render children?.()}
