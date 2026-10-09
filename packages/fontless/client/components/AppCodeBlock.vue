<script lang="ts" setup>
import { highlightAll } from 'microlighter'
import { nextTick, onMounted, watch } from 'vue'

const props = defineProps<{
  code: string
  lang: 'css'
}>()

onMounted(() => {
  watch(() => props.code, () => nextTick(() => highlightAll()), { immediate: true })
})
</script>

<template>
  <pre><code :class="`language-${lang}`">{{ code }}</code></pre>
</template>
