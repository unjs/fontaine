<script lang="ts">
  import { preloads } from 'fontless/runtime'
  import '../app.css'

  let { children } = $props()
</script>

<svelte:head>
  {#each preloads as attrs (attrs.href)}
    <link {...attrs} />
  {/each}
</svelte:head>

{@render children?.()}
