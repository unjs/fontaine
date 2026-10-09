<script lang="ts" setup>
import type { FontFaceData } from 'unifont'
import { formatBytes, getFontFileSize } from '../composables'
import AppBadge from './AppBadge.vue'

const props = defineProps<{
  font: FontFaceData
}>()

const url = props.font.src.find(i => 'url' in i)?.url
const { status, size: fileSize } = url ? await getFontFileSize(url) : {}

const badgeColor = status !== 200 ? 'bg-red-600 text-white' : fileSize === undefined || fileSize < 30000 ? '' : fileSize < 100000 ? 'text-yellow' : 'text-red'
</script>

<template>
  <AppBadge
    class="flex space-x-1 text-[0.6rem] rounded-full"
    :class="[badgeColor]"
  >
    <div
      v-if="status !== 200"
    >
      {{ status ?? 'Unknown' }}
    </div>
    <div v-else-if="fileSize !== undefined">
      {{ formatBytes(fileSize) }}
    </div>
    <div v-else>
      Unknown
    </div>
  </AppBadge>
</template>
