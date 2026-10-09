import type { DevframeDefinition } from 'devframe'
import type { SharedState } from 'devframe/utils/shared-state'
import type { ManualFontDetails, ProviderFontDetails } from './types'
import { fileURLToPath } from 'node:url'
import { description, version } from '../package.json'
import { generateFontFace } from './css/render'

/** Namespace of the RPC functions and shared state registered by the fontless devframe. */
export const FONTLESS_DEVFRAME_NAMESPACE = 'fontless'

export type FontlessDevframeFamily = (ManualFontDetails | ProviderFontDetails) & {
  /** Unique within one devframe. */
  id: number
  /** The `@font-face` declarations generated for `fonts`. */
  css: string
}

export interface FontlessDevframeState {
  families: FontlessDevframeFamily[]
}

declare module 'devframe' {
  interface DevframeRpcSharedStates {
    'fontless:fonts': FontlessDevframeState
  }
}

export interface FontlessDevframeOptions {
  /** Devframe id; also the default mount base (`/__<id>/`) and dock id. Default `fontless`. */
  id?: string
  /** Dock title. Default `Fonts`. */
  name?: string
  icon?: string
  basePath?: string
}

export interface FontlessDevframe {
  definition: DevframeDefinition
  /** Record a resolved family; safe to call before or after the devframe is set up, and from multiple hosts. */
  exposeFont: (font: ManualFontDetails | ProviderFontDetails) => void
}

/**
 * Create a devframe listing the font families resolved by fontless, for mounting in Vite
 * DevTools, Nuxt DevTools or any other devframe host.
 */
export function createFontlessDevframe(options: FontlessDevframeOptions = {}): FontlessDevframe {
  const families: FontlessDevframeFamily[] = []
  const seen = new Set<string>()
  const states = new Set<SharedState<FontlessDevframeState>>()

  function exposeFont(font: ManualFontDetails | ProviderFontDetails) {
    const serialized = JSON.stringify(font)
    if (seen.has(serialized)) {
      return
    }
    seen.add(serialized)

    const details = JSON.parse(serialized) as ManualFontDetails | ProviderFontDetails
    const css = details.type !== 'manual' && details.provider === 'local'
      ? ''
      : details.fonts.map(face => `${generateFontFace(details.fontFamily, face)}\n`).join('')
    const family: FontlessDevframeFamily = { ...details, id: families.length, css }
    families.push(family)

    for (const state of states) {
      state.mutate((draft) => {
        draft.families.push(family)
      })
    }
  }

  const definition: DevframeDefinition = {
    id: options.id ?? 'fontless',
    name: options.name ?? 'Fonts',
    version,
    packageName: 'fontless',
    importMetaUrl: import.meta.url,
    homepage: 'https://github.com/unjs/fontaine/tree/main/packages/fontless',
    description,
    icon: options.icon ?? 'carbon:text-font',
    basePath: options.basePath,
    clientAssets: fileURLToPath(new URL('../dist/devtools-client', import.meta.url)),
    capabilities: { build: false },
    async setup(ctx) {
      const state = await ctx.scope(FONTLESS_DEVFRAME_NAMESPACE).rpc.sharedState('fonts', {
        initialValue: { families: [] },
      })
      state.mutate((draft) => {
        draft.families = [...families]
      })
      states.add(state)
    },
  }

  return { definition, exposeFont }
}
