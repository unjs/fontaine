<script lang="ts" setup>
import type { FontlessDevframeFamily } from '../../src/devtools'

defineProps<{
  family: FontlessDevframeFamily
  active: boolean
  /** Whether a family no stylesheet uses can be marked as unused. */
  reportsUsage?: boolean
}>()
</script>

<template>
  <button
    class="card-base flex flex-col items-center gap-1 p-4 text-center min-w-0 hover:bg-active transition-colors"
    :class="{ 'bg-active! border-primary/50!': active }"
    :title="`Show details for ${family.fontFamily}`"
  >
    <span
      class="text-5xl leading-tight"
      :style="{ fontFamily: `'${family.fontFamily}'` }"
    >
      Aa
    </span>
    <span class="text-sm truncate max-w-full">
      {{ family.fontFamily }}
    </span>
    <span class="text-xs op-50 truncate max-w-full">
      {{ 'provider' in family ? family.provider : 'manual' }} · {{ family.fonts.length }} {{ family.fonts.length === 1 ? 'face' : 'faces' }}
    </span>
    <span class="flex flex-wrap justify-center items-center gap-1 text-[0.65rem] min-h-4">
      <span
        v-if="family.preloads.length"
        class="tag bg-blue/10 text-blue"
        :title="`${family.preloads.length} ${family.preloads.length === 1 ? 'face' : 'faces'} preloaded`"
      >
        <span class="i-carbon-flash" />preloaded
      </span>
      <span
        v-if="family.global"
        class="tag bg-purple/10 text-purple"
        title="Injected into the HTML whether or not your CSS uses it"
      >
        <span class="i-carbon-earth" />global
      </span>
      <span
        v-if="family.glyphs"
        class="tag bg-teal/10 text-teal"
        :title="`Subsetted to ${[...family.glyphs].length} glyphs`"
      >
        <span class="i-carbon-cut" />subset
      </span>
      <span
        v-if="reportsUsage && !family.usages.length && !family.global"
        class="tag bg-orange/10 text-orange"
        title="Resolved, but no stylesheet uses it any more"
      >
        <span class="i-carbon-unlink" />unused
      </span>
    </span>
  </button>
</template>
