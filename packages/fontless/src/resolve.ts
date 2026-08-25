import type { ConsolaInstance } from 'consola'
import type { FontFaceData, Provider, UnifontOptions } from 'unifont'
import type { GenericCSSFamily } from './css/parse'
import type { FontFamilyManualOverride, FontFamilyProviderOverride, FontlessOptions, ManualFontDetails, ProviderFamilyOptions, ProviderFontDetails, RawFontFaceData } from './types'

import type { FontFaceResolution } from './utils'
import { consola } from 'consola'
import { createUnifont } from 'unifont'
import { addLocalFallbacks } from './css/parse'
import { defaultValues } from './defaults'
import { normalizeGlyphs } from './subset'

interface ResolverContext {
  exposeFont?: (font: ManualFontDetails | ProviderFontDetails) => void
  normalizeFontData: (faces: RawFontFaceData | FontFaceData[], options?: { glyphs?: string }) => FontFaceData[]
  logger?: ConsolaInstance
  storage?: UnifontOptions['storage']
  options: FontlessOptions
  providers: Record<string, (opts: unknown) => Provider>
}

/** Family-level keys that are not `@font-face` descriptors and must not be passed through to `normalizeFontData`. */
const NON_DESCRIPTOR_KEYS = new Set(['name', 'global', 'preload', 'fallbacks', 'provider', 'providerOptions', 'glyphs'])

/**
 * Providers whose `experimental.glyphs` option means 'these characters', so a family's
 * `glyphs` can be passed through to them and subsetted server-side.
 *
 * `googleicons` is excluded deliberately: it reads the same option as a list of icon names.
 */
const GLYPH_PASSTHROUGH_PROVIDERS = new Set(['google'])

/** Ask providers that support it to serve an already-subsetted file. */
function withGlyphPassthrough(providerOptions: ProviderFamilyOptions | undefined, glyphs: string | undefined, providerNames: Iterable<string>): ProviderFamilyOptions | undefined {
  if (!glyphs) {
    return providerOptions
  }
  const options: ProviderFamilyOptions = { ...providerOptions }
  for (const name of providerNames) {
    if (!GLYPH_PASSTHROUGH_PROVIDERS.has(name)) {
      continue
    }
    const existing = options[name] as { experimental?: { glyphs?: string[] } } | undefined
    if (!existing?.experimental?.glyphs) {
      options[name] = { ...existing, experimental: { ...existing?.experimental, glyphs: [...glyphs] } }
    }
  }
  return options
}

function pickDescriptors(override: FontFamilyManualOverride): RawFontFaceData {
  const face: Record<string, unknown> = {}
  for (const key in override) {
    if (!NON_DESCRIPTOR_KEYS.has(key)) {
      face[key] = override[key as keyof FontFamilyManualOverride]
    }
  }
  return face as unknown as RawFontFaceData
}

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

/** Apply family-level `@font-face` descriptors to faces resolved by a provider. */
function applyFaceOverrides(override: FontFamilyManualOverride | FontFamilyProviderOverride | undefined, fonts: FontFaceData[]): FontFaceData[] {
  const display = override && 'display' in override ? override.display : undefined
  const rawUnicodeRange = override && 'unicodeRange' in override ? override.unicodeRange : undefined
  const unicodeRange = rawUnicodeRange ? toArray(rawUnicodeRange) : undefined
  if (!display && !unicodeRange) {
    return fonts
  }
  return fonts.map(font => ({
    ...font,
    ...(display && { display }),
    ...(unicodeRange && { unicodeRange }),
  }))
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
      delete providers[key]
    }
    else {
      const providerOptions = (options[key as 'google' | 'local' | 'adobe' | 'npm'] || {}) as Record<string, unknown>
      resolvedProviders.push(provider(providerOptions))
    }
  }

  if (resolvedProviders.length === 0) {
    throw new Error('At least one font provider must be configured')
  }

  for (const val of options.priority || []) {
    if (val in providers)
      prioritisedProviders.add(val)
  }
  for (const provider in providers) {
    prioritisedProviders.add(provider)
  }
  const unifont = await createUnifont(resolvedProviders as [Provider, ...Provider[]], {
    ...options,
    storage: context.storage,
  })

  // Custom merging for defaults - providing a value for any default will override module
  // defaults entirely (to prevent array merging)
  // Note: defaultValues.fallbacks uses shared category-aware presets from fontaine package
  const normalizedDefaults = {
    weights: [...new Set((options.defaults?.weights || defaultValues.weights).map(v => String(v)))],
    styles: [...new Set(options.defaults?.styles || defaultValues.styles)],
    subsets: [...new Set(options.defaults?.subsets || defaultValues.subsets)],
    formats: [...new Set(options.defaults?.formats || defaultValues.formats)],
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

  /**
   * Fallback families to generate metrics for, preferring an explicit override, then the generic
   * family declared alongside the font in CSS, then the category the provider reports for it.
   */
  function resolveFallbacks(override: FontFamilyManualOverride | FontFamilyProviderOverride | undefined, generic: GenericCSSFamily | undefined, providerFallbacks?: string[]): string[] {
    const explicit = override && 'fallbacks' in override ? override.fallbacks : undefined
    if (explicit) {
      return explicit
    }
    const category = generic ?? providerFallbacks?.find(fallback => fallback in normalizedDefaults.fallbacks) as GenericCSSFamily | undefined
    return normalizedDefaults.fallbacks[category || 'sans-serif']
  }

  const defaultGlyphs = normalizeGlyphs(options.defaults?.glyphs)

  return async function resolveFontFaceWithOverride(fontFamily: string, override?: FontFamilyManualOverride | FontFamilyProviderOverride, fallbackOptions?: { fallbacks: string[], generic?: GenericCSSFamily }): Promise<FontFaceResolution | undefined> {
    const fallbacks = resolveFallbacks(override, fallbackOptions?.generic)
    const glyphs = override?.glyphs ? normalizeGlyphs(override.glyphs) : defaultGlyphs

    if (override && 'src' in override) {
      const fonts = addFallbacks(fontFamily, normalizeFontData(pickDescriptors(override), { glyphs }))
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

    // Respect custom weights, styles, subsets and formats options
    const defaults = { ...normalizedDefaults, fallbacks }
    for (const key of ['weights', 'styles', 'subsets'] as const) {
      if (override?.[key]) {
        defaults[key as 'weights'] = override[key]!.map(v => String(v))
      }
    }
    if (override?.formats) {
      defaults.formats = override.formats
    }

    // provider-specific options if available
    const providerOptions = withGlyphPassthrough(
      override && 'providerOptions' in override ? override.providerOptions : undefined,
      glyphs,
      prioritisedProviders,
    )

    // Handle explicit provider
    if (override?.provider) {
      if (override.provider in providers) {
        const resolveOptions = providerOptions?.[override.provider]
          ? { ...defaults, options: { [override.provider]: providerOptions[override.provider] } }
          : defaults
        const result = await unifont.resolveFont(fontFamily, resolveOptions as typeof defaults, [override.provider])
        // Rewrite font source URLs to be proxied/local URLs
        const fonts = applyFaceOverrides(override, normalizeFontData(result.fonts, { glyphs }))
        if (!fonts.length) {
          const message = `Could not produce font face declaration from \`${override.provider}\` for font family \`${fontFamily}\`.`
          if (options.throwOnError) {
            throw new Error(message)
          }
          logger.warn(message)
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
          fallbacks: resolveFallbacks(override, fallbackOptions?.generic, result.fallbacks),
          fonts: fontsWithLocalFallbacks,
        }
      }

      // If not registered, log and fall back to default providers
      logger.warn(`Unknown provider \`${override.provider}\` for font family \`${fontFamily}\`. Falling back to default providers.`)
    }

    // Build options with provider-specific family options merged
    const resolveOptions = providerOptions
      ? { ...defaults, options: providerOptions }
      : defaults

    const result = await unifont.resolveFont(fontFamily, resolveOptions as typeof defaults, [...prioritisedProviders])
    // Rewrite font source URLs to be proxied/local URLs
    const fonts = applyFaceOverrides(override, normalizeFontData(result.fonts, { glyphs }))
    if (fonts.length === 0) {
      if (override) {
        logger.warn(`Could not produce font face declaration for \`${fontFamily}\` with override.`)
      }
      return
    }

    const fontsWithLocalFallbacks = addFallbacks(fontFamily, fonts)
    // TODO: expose provider name in result
    exposeFont({
      type: 'auto',
      fontFamily,
      provider: result.provider || 'unknown',
      fonts: fontsWithLocalFallbacks,
    })
    return {
      fallbacks: resolveFallbacks(override, fallbackOptions?.generic, result.fallbacks),
      fonts: fontsWithLocalFallbacks,
    }
  }
}
