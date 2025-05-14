import type { FontFaceData, LocalFontSource, Provider, ProviderFactory, providers, RemoteFontSource, ResolveFontOptions } from 'unifont'

import type { GenericCSSFamily } from './css/parse'

export type Awaitable<T> = T | Promise<T>

export type { FontFaceData }

export interface FontFallback {
  family?: string
  as: string
}

interface SharedFontDetails {
  fontFamily: string
  fonts: FontFaceData[]
}

export interface ManualFontDetails extends SharedFontDetails {
  type: 'manual'
}

export interface ProviderFontDetails extends SharedFontDetails {
  type: 'override' | 'auto'
  provider: string
}

// TODO: Font metric providers
// export interface FontFaceAdjustments {
//   ascentOverride?: string // ascent-override
//   descentOverride?: string // descent-override
//   lineGapOverride?: string // line-gap-override
//   sizeAdjust?: string // size-adjust
// }

export type FontProviderName = (string & {}) | 'google' | 'local' | 'none'

export interface FontFamilyOverrides {
  /** The font family to apply this override to. */
  name: string
  /** Inject `@font-face` regardless of usage in project. */
  global?: boolean
  /**
   * Enable or disable adding preload links to the initially rendered HTML.
   * This is true by default for the highest priority format unless a font is subsetted (to avoid over-preloading).
   */
  preload?: boolean

  // TODO:
  // as?: string
}
export interface FontFamilyProviderOverride extends FontFamilyOverrides, Partial<Omit<ResolveFontOptions, 'weights'> & { weights: Array<string | number> }> {
  /** The provider to use when resolving this font. */
  provider?: FontProviderName
}

export type FontSource = string | LocalFontSource | RemoteFontSource

export interface RawFontFaceData extends Omit<FontFaceData, 'src' | 'unicodeRange'> {
  src: FontSource | Array<FontSource>
  unicodeRange?: string | string[]
}

export interface FontFamilyManualOverride extends FontFamilyOverrides, RawFontFaceData {
  /** Font families to generate fallback metrics for. */
  fallbacks?: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProviderOption = ((options: any) => Provider) | string | false

export interface FontlessOptions {
  /**
   * Specify overrides for individual font families.
   *
   * ```ts
   * fonts: {
   *   families: [
   *     // do not resolve this font with any provider from `@nuxt/fonts`
   *     { name: 'Custom Font', provider: 'none' },
   *     // only resolve this font with the `google` provider
   *     { name: 'My Font Family', provider: 'google' },
   *     // specify specific font data
   *     { name: 'Other Font', src: 'https://example.com/font.woff2' },
   *   ]
   * }
   * ```
   */
  families?: Array<FontFamilyManualOverride | FontFamilyProviderOverride>
  defaults?: Partial<{
    preload: boolean
    weights: Array<string | number>
    styles: ResolveFontOptions['styles']
    subsets: ResolveFontOptions['subsets']
    fallbacks?: Partial<Record<GenericCSSFamily, string[]>>
  }>
  providers?: {
    adobe?: ProviderOption
    bunny?: ProviderOption
    fontshare?: ProviderOption
    fontsource?: ProviderOption
    google?: ProviderOption
    googleicons?: ProviderOption
    [key: string]: ProviderOption | undefined
  }
  /** Configure the way font assets are exposed */
  assets: {
    /**
     * The baseURL where font files are served.
     * @default '/_fonts/'
     */
    prefix?: string
    /** Currently font assets are exposed as public assets as part of the build. This will be configurable in future */
    strategy?: 'public'
  }
  /** Options passed directly to `local` font provider (none currently) */
  local?: Record<string, never>
  /** Options passed directly to `adobe` font provider */
  adobe?: typeof providers.adobe extends ProviderFactory<infer O> ? O : Record<string, never>
  /** Options passed directly to `bunny` font provider */
  bunny?: typeof providers.bunny extends ProviderFactory<infer O> ? O : Record<string, never>
  /** Options passed directly to `fontshare` font provider */
  fontshare?: typeof providers.fontshare extends ProviderFactory<infer O> ? O : Record<string, never>
  /** Options passed directly to `fontsource` font provider */
  fontsource?: typeof providers.fontsource extends ProviderFactory<infer O> ? O : Record<string, never>
  /** Options passed directly to `google` font provider */
  google?: typeof providers.google extends ProviderFactory<infer O> ? O : Record<string, never>
  /** Options passed directly to `googleicons` font provider */
  googleicons?: typeof providers.googleicons extends ProviderFactory<infer O> ? O : Record<string, never>
  /**
   * An ordered list of providers to check when resolving font families.
   *
   * After checking these providers, Nuxt Fonts will proceed by checking the
   *
   * Default behaviour is to check all user providers in the order they were defined, and then all built-in providers.
   */
  priority?: string[]
  /**
   * In some cases you may wish to use only one font provider. This is equivalent to disabling all other font providers.
   */
  provider?: FontProviderName
  /**
   * You can enable support for processing CSS variables for font family names.
   * @default 'font-prefixed-only'
   */
  processCSSVariables?: boolean | 'font-prefixed-only'
  experimental?: {
    /**
     * You can disable adding local fallbacks for generated font faces, like `local('Font Face')`.
     * @default false
     */
    disableLocalFallbacks?: boolean
    /**
     * You can enable support for processing CSS variables for font family names.
     * @default 'font-prefixed-only'
     * @deprecated This feature is no longer experimental. Use `processCSSVariables` instead. For Tailwind v4 users, setting this option to `true` is no longer needed or recommended.
     */
    processCSSVariables?: boolean | 'font-prefixed-only'
  }
}
