<script lang="ts" setup>
defineProps<{
  family: string
  fallback: string
  text: string
  adjusted: boolean
  /** Whether the fallback font is installed on this machine. */
  available?: boolean
  /** Whether this is the fallback the browser uses on this machine. */
  used?: boolean
}>()
</script>

<template>
  <div
    class="flex flex-col gap-1"
    :class="{ 'op-50': available === false }"
  >
    <div class="flex items-center gap-2">
      <span class="text-sm">{{ fallback }}</span>
      <span
        v-if="used"
        class="tag text-[0.65rem] bg-green/10 text-green"
        title="The first installed fallback, so the one this browser renders while the font loads"
      >
        used on this machine
      </span>
      <span
        v-else-if="available === false"
        class="tag text-[0.65rem] bg-gray/10"
        title="Not installed on this machine, so the browser skips it"
      >
        not installed
      </span>
    </div>
    <div
      v-if="available !== false"
      class="relative text-2xl leading-normal whitespace-nowrap overflow-hidden"
    >
      <div
        class="text-sky-600 dark:text-sky-400"
        :style="{ fontFamily: `'${family}'` }"
      >
        {{ text }}
      </div>
      <div
        class="absolute inset-0 text-rose-500/70"
        :style="{ fontFamily: adjusted ? `'${family} Fallback: ${fallback}'` : `'${fallback}'` }"
      >
        {{ text }}
      </div>
    </div>
  </div>
</template>
