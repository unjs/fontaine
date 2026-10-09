<script lang="ts" setup>
defineProps<{
  search?: string
}>()

const emit = defineEmits<{
  'update:search': [value: string]
}>()
</script>

<template>
  <div class="flex flex-1 flex-col flex-wrap gap-2 border-b border-base navbar-glass p-4">
    <div class="flex flex-wrap items-center gap-4">
      <div
        v-if="search !== undefined"
        class="flex flex-auto items-center border border-base rounded bg-base py-1 pl-1 pr-2 px-3 py-2 focus-within:border-primary"
      >
        <div class="i-carbon-search ml-0.3em mr-0.1em text-1.1em op50" />
        <input
          class="ml-0.4em w-full flex-auto bg-base outline-none!"
          placeholder="Search..."
          :value="search"
          @input="emit('update:search', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <slot name="actions" />
    </div>
    <slot />
  </div>
</template>
