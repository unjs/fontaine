export { normalizeFontData } from './assets'

export type { NormalizeFontDataContext, RenderedFont } from './assets'
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
  FontFormat,
  FontlessOptions,
  FontProviderName,
  FontSource,
  ManualFontDetails,
  PreloadOption,
  ProviderFamilyOptions,
  ProviderFontDetails,
  ResolvedVariableAxisOptions,
  VariableAxisOptions,
} from './types'

export { transformCSS } from './utils'
export type { FontFamilyInjectionPluginOptions } from './utils'

export { fontless } from './vite'
