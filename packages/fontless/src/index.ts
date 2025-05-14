export { fontless } from './vite'

export { normalizeFontData } from './assets'
export type { NormalizeFontDataContext } from './assets'

export { generateFontFace, parseFont } from './css/render'

export { defaultOptions, defaultValues } from './defaults'

export { resolveProviders } from './providers'

export { createResolver } from './resolve'
export type { Resolver } from './resolve'

export { resolveMinifyCssEsbuildOptions, transformCSS } from './utils'
export type { FontFamilyInjectionPluginOptions } from './utils'

export type {
  FontlessOptions,
  FontFallback,
  ManualFontDetails,
  ProviderFontDetails,
  FontFamilyManualOverride,
  FontFamilyOverrides,
  FontFamilyProviderOverride,
  FontProviderName,
  FontSource,
} from './types'
