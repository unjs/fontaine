<script lang="ts" setup>
defineProps<{
  icon?: string
  text?: string
  containerClass?: string
}>()

const open = defineModel<boolean>('open', { default: true })
</script>

<template>
  <details
    :open="open"
    @toggle="open = ($event.target as HTMLDetailsElement).open"
  >
    <summary class="cursor-pointer select-none p-4 hover:bg-active">
      <div
        class="flex items-center gap-2 text-xl transition"
        :class="open ? 'op100' : 'op60'"
      >
        <div
          v-if="icon"
          class="flex-none"
          :class="icon"
        />
        <div class="text-base">
          <slot name="text">
            {{ text }}
          </slot>
        </div>
        <div class="flex-auto" />
        <div class="chevron i-carbon-chevron-down flex-none cursor-pointer place-self-start text-base op75 transition duration-500" />
      </div>
    </summary>
    <div class="flex flex-col gap-2 px-4 pb-6 pt-2">
      <div
        class="mt-1"
        :class="containerClass"
      >
        <slot />
      </div>
    </div>
  </details>
</template>

<style scoped>
summary {
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}

details[open] .chevron {
  opacity: 0.75;
  transform: rotate(180deg);
}
</style>
