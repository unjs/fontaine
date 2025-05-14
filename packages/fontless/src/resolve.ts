import { createUnifont } from 'unifont'
import type { FontFaceData, Provider, UnifontOptions } from 'unifont'
import { consola } from 'consola'
import type { ConsolaInstance } from 'consola'

import type { ManualFontDetails, ProviderFontDetails, FontFamilyManualOverride, FontFamilyProviderOverride, FontlessOptions, RawFontFaceData } from './types'
import type { FontFaceResolution } from './utils'
import { addLocalFallbacks } from './css/parse'
import type { GenericCSSFamily } from './css/parse'
import { defaultValues } from './defaults'

interface ResolverContext {
  exposeFont?: (font: ManualFontDetails | ProviderFontDetails) => void
  normalizeFontData: (faces: RawFontFaceData | FontFaceData[]) => FontFaceData[]
  logger?: ConsolaInstance
  storage?: UnifontOptions['storage']
  options: FontlessOptions
  providers: Record<string, (opts: unknown) => Provider>
}

export type Resolver = (fontFamily: string, override?: FontFamilyManualOverride | FontFamilyProviderOverride, fallbackOptions?: {
  fallbacks: string[]
  generic?: GenericCSSFamily
}) => Promise<FontFaceResolution | undefined>

export async function createResolver(context: ResolverContext): Promise<Resolver> {
  const { options, normalizeFontData, providers, exposeFont = () => {}, logger = consola.withTag('fontless') } = context

  const resolvedProviders: Array<Provider> = []
  const prioritisedProviders = new Set<string>()

  for (const [key, provider] of Object.entries(providers)) {
    if (options.providers?.[key] === false || (options.provider && options.provider !== key)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete providers[key]
    }
    else {
      const providerOptions = (options[key as 'google' | 'local' | 'adobe'] || {}) as Record<string, unknown>
      resolvedProviders.push(provider(providerOptions))
    }
  }

  for (const val of options.priority || []) {
    if (val in providers) prioritisedProviders.add(val)
  }
  for (const provider in providers) {
    prioritisedProviders.add(provider)
  }

  const unifont = await createUnifont(resolvedProviders, { storage: context.storage })

  // Custom merging for defaults - providing a value for any default will override module
  // defaults entirely (to prevent array merging)
  const normalizedDefaults = {
    weights: [...new Set((options.defaults?.weights || defaultValues.weights).map(v => String(v)))],
    styles: [...new Set(options.defaults?.styles || defaultValues.styles)],
    subsets: [...new Set(options.defaults?.subsets || defaultValues.subsets)],
    fallbacks: Object.fromEntries(Object.entries(defaultValues.fallbacks).map(([key, value]) => [
      key,
      Array.isArray(options.defaults?.fallbacks) ? options.defaults.fallbacks : options.defaults?.fallbacks?.[key as GenericCSSFamily] || value,
    ])) as Record<GenericCSSFamily, string[]>,
  }

  function addFallbacks(fontFamily: string, font: FontFaceData[]) {
    if (options.experimental?.disableLocalFallbacks) {
      return font
    }
    return addLocalFallbacks(fontFamily, font)
  }

  return async function resolveFontFaceWithOverride(fontFamily: string, override?: FontFamilyManualOverride | FontFamilyProviderOverride, fallbackOptions?: { fallbacks: string[], generic?: GenericCSSFamily }): Promise<FontFaceResolution | undefined> {
    const fallbacks = override?.fallbacks || normalizedDefaults.fallbacks[fallbackOptions?.generic || 'sans-serif']

    if (override && 'src' in override) {
      const fonts = addFallbacks(fontFamily, normalizeFontData({
        src: override.src,
        display: override.display,
        weight: override.weight,
        style: override.style,
      }))
      exposeFont({
        type: 'manual',
        fontFamily,
        fonts,
      })
      return {
        fallbacks,
        fonts,
      }
    }

    // Respect fonts that should not be resolved through `@nuxt/fonts`
    if (override?.provider === 'none') {
      return
    }

    // Respect custom weights, styles and subsets options
    const defaults = { ...normalizedDefaults, fallbacks }
    for (const key of ['weights', 'styles', 'subsets'] as const) {
      if (override?.[key]) {
        defaults[key as 'weights'] = override[key]!.map(v => String(v))
      }
    }

    // Handle explicit provider
    if (override?.provider) {
      if (override.provider in providers) {
        const result = await unifont.resolveFont(fontFamily, defaults, [override.provider])
        // Rewrite font source URLs to be proxied/local URLs
        const fonts = normalizeFontData(result?.fonts || [])
        if (!fonts.length || !result) {
          logger.warn(`Could not produce font face declaration from \`${override.provider}\` for font family \`${fontFamily}\`.`)
          return
        }
        const fontsWithLocalFallbacks = addFallbacks(fontFamily, fonts)
        exposeFont({
          type: 'override',
          fontFamily,
          provider: override.provider,
          fonts: fontsWithLocalFallbacks,
        })
        return {
          fallbacks: result.fallbacks || defaults.fallbacks,
          fonts: fontsWithLocalFallbacks,
        }
      }

      // If not registered, log and fall back to default providers
      logger.warn(`Unknown provider \`${override.provider}\` for font family \`${fontFamily}\`. Falling back to default providers.`)
    }

    const result = await unifont.resolveFont(fontFamily, defaults, [...prioritisedProviders])
    if (result) {
      // Rewrite font source URLs to be proxied/local URLs
      const fonts = normalizeFontData(result.fonts)
      if (fonts.length > 0) {
        const fontsWithLocalFallbacks = addFallbacks(fontFamily, fonts)
        // TODO: expose provider name in result
        exposeFont({
          type: 'auto',
          fontFamily,
          provider: result.provider || 'unknown',
          fonts: fontsWithLocalFallbacks,
        })
        return {
          fallbacks: result.fallbacks || defaults.fallbacks,
          fonts: fontsWithLocalFallbacks,
        }
      }
      if (override) {
        logger.warn(`Could not produce font face declaration for \`${fontFamily}\` with override.`)
      }
    }
  }
}
