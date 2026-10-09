import type { DevframeConnectionStatus, DevframeRpcClient } from 'devframe/client'
import type { FontlessDevframeState } from '../src/devtools'
import { connectDevframe } from 'devframe/client'
import { computed, ref, shallowRef, watchEffect } from 'vue'

export const DEFAULT_DOCS_URL = 'https://github.com/unjs/fontaine/tree/main/packages/fontless#devtools'

export function useFontless() {
  const state = shallowRef<FontlessDevframeState>()
  const status = ref<DevframeConnectionStatus>('connecting')
  const hostColor = ref<string>()
  let client: DevframeRpcClient | undefined

  const primaryColor = computed(() => state.value?.ui.primaryColor || hostColor.value)
  watchEffect(() => {
    if (primaryColor.value && CSS.supports('color', primaryColor.value)) {
      document.documentElement.style.setProperty('--fontless-primary', primaryColor.value)
    }
    else {
      document.documentElement.style.removeProperty('--fontless-primary')
    }
  })

  connectDevframe().then(async (rpc) => {
    client = rpc
    status.value = rpc.status
    hostColor.value = (rpc.connectionMeta.configs as { ui?: { branding?: { primaryColor?: string } } } | undefined)?.ui?.branding?.primaryColor
    rpc.events.on('connection:status', (value) => {
      status.value = value
    })
    // No `initialValue`: hydrating from one writes the server snapshot back to the node side
    const shared = await rpc.scope('fontless').rpc.sharedState('fonts')
    state.value = shared.value() as FontlessDevframeState | undefined
    shared.on('updated', (value) => {
      state.value = value
    })
  }, () => {
    status.value = 'error'
  })

  async function openInEditor(path: string) {
    const open = client?.services.get('@devframes/service-open')
    if (open) {
      await open.rpc.call('open-in-editor', { path })
    }
    else {
      await fetch(`/__open-in-editor?file=${encodeURIComponent(path)}`)
    }
  }

  return { state, status, openInEditor }
}

export interface FontFileSize {
  status?: number
  size?: number
}

const fileSizes = new Map<string, Promise<FontFileSize>>()

export function getFontFileSize(url: string): Promise<FontFileSize> {
  let size = fileSizes.get(url)
  if (!size) {
    size = fetch(new URL(url, location.origin), { method: 'HEAD' }).then((response) => {
      const length = response.headers.get('content-length')
      return { status: response.status, size: length === null ? undefined : Number(length) }
    }, () => ({}))
    fileSizes.set(url, size)
  }
  return size
}

const localFonts = new Map<string, Promise<boolean>>()

/** Whether `local()` finds a font of this name on this machine. */
export function isLocalFontAvailable(name: string): Promise<boolean> {
  let available = localFonts.get(name)
  if (!available) {
    available = new FontFace('fontless-local-font-check', `local(${JSON.stringify(name)})`).load().then(() => true, () => false)
    localFonts.set(name, available)
  }
  return available
}

export function formatBytes(bytes: number): string {
  if (bytes === 0)
    return '0 B'

  const units = ['B', 'kB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1000)), units.length - 1)

  return `${(bytes / 1000 ** i).toFixed(i ? 1 : 0)} ${units[i]}`
}

/** The path of a stylesheet id relative to `root`, without its query. */
export function displayPath(id: string, root?: string): string {
  const path = id.replace(/\?.*$/, '')
  return root && path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path
}
