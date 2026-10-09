<script lang="ts" setup>
import { Pane, Splitpanes } from 'splitpanes'
import { computed, ref, watch } from 'vue'
import 'splitpanes/dist/splitpanes.css'

const props = withDefaults(defineProps<{
  storageKey?: string
  stateKey?: string
  leftSize?: number
  minSize?: number
  horizontal?: boolean
}>(), {
  stateKey: 'nuxt-devtools-panels-state',
  minSize: 10,
})

defineSlots<{
  left?: () => unknown
  right?: () => unknown
}>()

const DEFAULT_SIZE = 30

const state = ref<Record<string, number>>(readState())
watch(state, value => localStorage.setItem(props.stateKey, JSON.stringify(value)), { deep: true })

function readState(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(props.stateKey) || '{}')
  }
  catch {
    return {}
  }
}

const fallback = ref(props.leftSize ?? DEFAULT_SIZE)

const size = computed({
  get: () => props.storageKey ? state.value[props.storageKey] ?? props.leftSize ?? DEFAULT_SIZE : fallback.value,
  set: (value) => {
    if (props.storageKey) {
      state.value[props.storageKey] = value
    }
    else {
      fallback.value = value
    }
  },
})
</script>

<template>
  <!-- `Splitpanes` renders its panes through an inner functional component, so a pane added
       or removed by a `v-if` on the slot is not picked up until it remounts. -->
  <Splitpanes
    :key="$slots.right ? 'two-panes' : 'one-pane'"
    :horizontal="horizontal"
    class="h-full of-hidden"
    @resize="size = $event.panes[0]!.size"
  >
    <Pane
      class="h-full of-auto!"
      :size="size"
      :min-size="$slots.right ? minSize : 100"
    >
      <slot name="left" />
    </Pane>
    <Pane
      v-if="$slots.right"
      class="relative h-full of-auto!"
      :min-size="minSize"
    >
      <slot name="right" />
    </Pane>
  </Splitpanes>
</template>
