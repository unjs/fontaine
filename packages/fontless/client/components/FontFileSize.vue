<script lang="ts" setup>
import type { FontFaceData } from 'unifont'
import AppBadge from './AppBadge.vue'

const props = defineProps<{
  font: FontFaceData
}>()

const url = props.font.src.find(i => 'url' in i)?.url
let status: number | undefined
let fileSize: number | undefined
if (url) {
  try {
    // TODO: Should just use HEAD. But seems like Vite devserver is not handling HEADs properly. Needs investigation.
    const response = await fetch(new URL(url, location.origin))
    status = response.status
    const length = response.headers.get('content-length')
    fileSize = length === null ? undefined : Number(length)
  }
  catch {}
}

function formatBytes(bytes: number) {
  if (bytes === 0)
    return '0 Bytes'

  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1000))
  const formattedSize = (bytes / 1000 ** i).toFixed(2)

  return `${formattedSize}${sizes[i]}`
}

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
