export { normalizeFontData } from './assets'

export type { NormalizeFontDataContext } from './assets'
export { generateFontFace, parseFont } from './css/render'

export { defaultOptions, defaultValues } from './defaults'

export { resolveProviders } from './providers'

export { createResolver } from './resolve'

export type { Resolver } from './resolve'
export type {
  FontFallback,
  FontFamilyManualOverride,
  FontFamilyOverrides,
  FontFamilyProviderOverride,
  FontlessOptions,
  FontProviderName,
  FontSource,
  ManualFontDetails,
  ProviderFontDetails,
} from './types'

export { resolveMinifyCssEsbuildOptions, transformCSS } from './utils'
export type { FontFamilyInjectionPluginOptions } from './utils'

export { fontless } from './vite'
