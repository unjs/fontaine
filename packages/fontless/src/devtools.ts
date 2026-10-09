import type { DevframeDefinition } from 'devframe'
import type { SharedState } from 'devframe/utils/shared-state'
import type { ManualFontDetails, ProviderFontDetails } from './types'
import type { FontFamilyUsage } from './utils'
import { fileURLToPath } from 'node:url'
import { description, version } from '../package.json'
import { isSystemFontFamily } from './css/parse'
import { generateFontFace, generateFontFallbacks } from './css/render'

/** Namespace of the RPC functions and shared state registered by the fontless devframe. */
export const FONTLESS_DEVFRAME_NAMESPACE = 'fontless'

type StoredFamily = (ManualFontDetails | ProviderFontDetails) & {
  /** Unique within one devframe. */
  id: number
  /** The `@font-face` declarations generated for `fonts`. */
  css: string
}

interface FamilyUsageSummary {
  /** Families that metric-override fallbacks were generated for, across every usage. */
  fallbacks: string[]
  /** Stylesheets using the family. */
  usages: string[]
  /** Whether the family is declared `global`. */
  global: boolean
  /** URLs of the faces that are preloaded. */
  preloads: string[]
}

export type FontlessDevframeFamily = StoredFamily & FamilyUsageSummary & {
  /** The metric-override `@font-face` declarations generated for `fallbacks`. */
  fallbackCSS: string
}

/** A font family used in a stylesheet that no `@font-face` declarations were generated for. */
export interface FontlessDevframeUnresolvedFamily {
  fontFamily: string
  /** Whether the family is provided by the operating system, so is never resolved. */
  system: boolean
  usages: string[]
}

/** How the panel presents itself, so it can match the host it is mounted in. */
export interface FontlessDevframeUIOptions {
  /** Accent colour, as any CSS colour. Defaults to the host's brand colour, where it sets one. */
  primaryColor?: string
  /** How the `families` option is written in the host's config, for hints. Default `families`. */
  familiesOption?: string
  /** Documentation linked from the panel. Default the fontless README. */
  docsURL?: string
}

export interface FontlessDevframeState {
  /** The directory usage paths are shown relative to. */
  root: string
  /** Whether usage is reported for every stylesheet, so a family without usages is unused. */
  reportsUsage: boolean
  ui: FontlessDevframeUIOptions
  families: FontlessDevframeFamily[]
  unresolved: FontlessDevframeUnresolvedFamily[]
  warnings: string[]
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
  /**
   * Set when `exposeUsage` is passed to `transformCSS` for every stylesheet, so families that
   * no stylesheet uses can be marked as unused.
   */
  reportsUsage?: boolean
  ui?: FontlessDevframeUIOptions
}

export interface FontlessDevframe {
  definition: DevframeDefinition
  /** Record a resolved family; pass to `createResolver`. Safe to call before or after the devframe is set up, and from multiple hosts. */
  exposeFont: (font: ManualFontDetails | ProviderFontDetails) => void
  /**
   * Record the families a stylesheet uses; pass to `transformCSS`. Replaces the families
   * recorded earlier for the same stylesheet. Pass an `id` of `undefined` for families declared `global`.
   */
  exposeUsage: (id: string | undefined, usages: FontFamilyUsage[]) => void
  /** Record a warning logged while resolving fonts. */
  exposeWarning: (message: string) => void
}

const MAX_WARNINGS = 100
const FLUSH_DELAY = 50
const GLOBAL_USAGE = ''

function unique<T>(values: Iterable<T>): T[] {
  return [...new Set(values)]
}

/**
 * Create a devframe listing the font families resolved by fontless, for mounting in Vite
 * DevTools, Nuxt DevTools or any other devframe host.
 */
export function createFontlessDevframe(options: FontlessDevframeOptions = {}): FontlessDevframe {
  const families = new Map<string, StoredFamily>()
  const stylesheets = new Map<string, FontFamilyUsage[]>()
  const fallbackCSS = new Map<string, { key: string, css: string }>()
  const warnings = new Set<string>()
  const states = new Set<SharedState<FontlessDevframeState>>()
  let nextId = 0

  function usagesOf(fontFamily: string): Array<[id: string, usage: FontFamilyUsage]> {
    return [...stylesheets].flatMap(([id, usages]) => usages.filter(usage => usage.fontFamily === fontFamily).map(usage => [id, usage] as [string, FontFamilyUsage]))
  }

  function summarise(fontFamily: string): FamilyUsageSummary {
    const list = usagesOf(fontFamily)
    return {
      fallbacks: unique(list.flatMap(([, usage]) => usage.fallbacks)),
      usages: unique(list.flatMap(([id]) => id === GLOBAL_USAGE ? [] : [id])),
      global: list.some(([id]) => id === GLOBAL_USAGE),
      preloads: unique(list.flatMap(([, usage]) => usage.preloads)),
    }
  }

  function snapshot(): Omit<FontlessDevframeState, 'root'> {
    const unresolved: FontlessDevframeUnresolvedFamily[] = []
    for (const fontFamily of unique([...stylesheets.values()].flatMap(usages => usages.map(usage => usage.fontFamily)))) {
      if (!families.has(fontFamily) && !usagesOf(fontFamily).some(([, usage]) => usage.resolved)) {
        unresolved.push({ fontFamily, system: isSystemFontFamily(fontFamily), usages: summarise(fontFamily).usages })
      }
    }
    return {
      reportsUsage: !!options.reportsUsage,
      ui: { ...options.ui },
      families: [...families.values()].map(family => ({
        ...family,
        ...summarise(family.fontFamily),
        fallbackCSS: fallbackCSS.get(family.fontFamily)?.css ?? '',
      })),
      unresolved,
      warnings: [...warnings],
    }
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  function flush() {
    timer = undefined
    const value = snapshot()
    for (const state of states) {
      state.mutate((draft) => {
        Object.assign(draft, value)
      })
    }
  }
  function scheduleFlush() {
    if (states.size) {
      timer ??= setTimeout(flush, FLUSH_DELAY)
    }
  }

  async function renderFallbacks(fontFamily: string) {
    const family = families.get(fontFamily)
    const { fallbacks } = summarise(fontFamily)
    if (!family || !fallbacks.length) {
      return
    }
    const face = family.fonts.find(font => !font.style || font.style === 'normal') ?? family.fonts[0]!
    const key = JSON.stringify([face, fallbacks])
    if (fallbackCSS.get(fontFamily)?.key === key) {
      return
    }
    fallbackCSS.set(fontFamily, { key, css: '' })
    const css = await generateFontFallbacks(fontFamily, face, fallbacks.map(font => ({ font, name: `${fontFamily} Fallback: ${font}` })))
      .then(declarations => declarations.join('\n'), (error: Error) => {
        exposeWarning(error.message)
        return ''
      })
    if (fallbackCSS.get(fontFamily)?.key === key) {
      fallbackCSS.set(fontFamily, { key, css })
      scheduleFlush()
    }
  }

  function exposeFont(font: ManualFontDetails | ProviderFontDetails) {
    const details = JSON.parse(JSON.stringify(font)) as ManualFontDetails | ProviderFontDetails
    const css = details.type !== 'manual' && details.provider === 'local'
      ? ''
      : details.fonts.map(face => `${generateFontFace(details.fontFamily, face)}\n`).join('')
    const id = families.get(details.fontFamily)?.id ?? nextId++
    families.set(details.fontFamily, { ...details, id, css })
    void renderFallbacks(details.fontFamily)
    scheduleFlush()
  }

  function exposeUsage(id: string | undefined, usages: FontFamilyUsage[]) {
    stylesheets.set(id ?? GLOBAL_USAGE, JSON.parse(JSON.stringify(usages)))
    for (const fontFamily of unique(usages.map(usage => usage.fontFamily))) {
      void renderFallbacks(fontFamily)
    }
    scheduleFlush()
  }

  function exposeWarning(message: string) {
    if (warnings.has(message) || warnings.size >= MAX_WARNINGS) {
      return
    }
    warnings.add(message)
    scheduleFlush()
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
        initialValue: { root: ctx.cwd, reportsUsage: false, ui: {}, families: [], unresolved: [], warnings: [] },
      })
      const value = snapshot()
      state.mutate((draft) => {
        Object.assign(draft, value)
      })
      states.add(state)
    },
  }

  return { definition, exposeFont, exposeUsage, exposeWarning }
}
