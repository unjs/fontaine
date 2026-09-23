import type { FontFaceData, GoogleFamilyOptions, GoogleiconsFamilyOptions, LocalFontSource, Provider, ProviderFactory, providers, RemoteFontSource, ResolveFontOptions, ResolveFontResult } from 'unifont'

import type { GenericCSSFamily } from './css/parse'

export type FontFormat = ResolveFontOptions['formats'][number]

/** Requested values for variable font axes, keyed by OpenType axis tag. */
export type VariableAxisOptions = NonNullable<ResolveFontOptions['variableAxis']>

/** What `unifont` reports became of each requested variable font axis. */
export type ResolvedVariableAxisOptions = NonNullable<ResolveFontResult['variableAxis']>

export type Awaitable<T> = T | Promise<T>

/**
 * The minimal cache surface fontless requires. Any `unstorage` instance satisfies it.
 */
export interface FontlessStorage {
  getItem: (key: string) => Awaitable<any>
  setItem: (key: string, value: any) => Awaitable<void>
  getItemRaw: (key: string) => Awaitable<any>
  setItemRaw: (key: string, value: any) => Awaitable<void>
}

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

/** CSS font metric override descriptors. */
interface FontFaceMetricOverrides {
  /** `ascent-override` descriptor. */
  ascentOverride?: string
  /** `descent-override` descriptor. */
  descentOverride?: string
  /** `line-gap-override` descriptor. */
  lineGapOverride?: string
  /** `size-adjust` descriptor. */
  sizeAdjust?: string
}

/** Font face data with the descriptors `fontless` supports on top of those `unifont` resolves. */
export type NormalizedFontFaceData = FontFaceData & FontFaceMetricOverrides

export type FontProviderName = (string & {}) | 'google' | 'local' | 'none'

export interface FontFamilyOverrides {
  /** The font family to apply this override to. */
  name: string
  /**
   * Inject `@font-face` regardless of usage in the project, into the HTML `<head>` rather
   * than into any stylesheet. Usage sites found in CSS still gain fallback metric
   * families. Also available as `globalFontFaces` from `fontless/runtime`.
   */
  global?: boolean
  preload?: PreloadOption
  /**
   * Reduce every font file emitted for this family to the glyphs needed to render these
   * characters, whichever provider served it.
   *
   * Accepts a string of text or an array of characters. Where the provider can subset
   * server-side (Google Fonts' `text=`) the list is passed through to it as well, so the
   * full file is never downloaded.
   *
   * Subsetting modifies the font file you ship; check that the font's licence allows it.
   *
   * @example 'Handgloves & 0123'
   */
  glyphs?: string | string[]
  /**
   * Values to resolve variable font axes at, keyed by OpenType axis tag. A number or string
   * pins the axis to a single value, and a `[min, max]` pair or `{ min, max }` object narrows
   * it to an inclusive range.
   *
   * The request is passed to the provider, which serves an already-instanced file where it
   * can. Otherwise the axis is applied to the downloaded file, which requires `subset-font`
   * and a glyph list to subset to, either from `glyphs` or from the face's `unicode-range`.
   *
   * `wght` and `ital` are left alone: they are expressed by `@font-face` descriptors.
   *
   * **Experimental.** Provider support and the option shape may change.
   *
   * @example { CASL: [1], MONO: [{ min: 0, max: 1 }] }
   * @see {@link https://github.com/unjs/unifont | unifont} for the axes each provider supports.
   */
  variableAxis?: VariableAxisOptions

  // TODO:
  // as?: string
}
/** Provider-specific family options that can be passed when resolving a font */
export type ProviderFamilyOptions = {
  google?: GoogleFamilyOptions
  googleicons?: GoogleiconsFamilyOptions
} & Record<string, Record<string, unknown> | undefined>

export interface FontFamilyProviderOverride extends FontFamilyOverrides, FontFaceMetricOverrides, Partial<Omit<ResolveFontOptions, 'weights' | 'options'> & { weights: Array<string | number> }> {
  /** The provider to use when resolving this font. */
  provider?: FontProviderName
  /**
   * Provider-specific options for this font family.
   * These options are passed to the provider when resolving this specific font.
   */
  providerOptions?: ProviderFamilyOptions
  /** `font-display` descriptor to apply to every `@font-face` resolved for this family. */
  display?: FontFaceData['display']
  /** `unicode-range` descriptor to apply to every `@font-face` resolved for this family. */
  unicodeRange?: string | string[]
}

export type FontSource = string | LocalFontSource | RemoteFontSource

export interface RawFontFaceData extends Omit<FontFaceData, 'src' | 'unicodeRange'>, FontFaceMetricOverrides {
  src: FontSource | Array<FontSource>
  unicodeRange?: string | string[]
}

export interface FontFamilyManualOverride extends FontFamilyOverrides, RawFontFaceData {
  /** Font families to generate fallback metrics for. */
  fallbacks?: string[]
}

type ProviderOption = ((options: any) => Provider) | string | false

/**
 * Enable adding preload links to the initially rendered HTML.
 *
 * `true` preloads a single face per family, preferring the first configured `format`,
 * then the first configured subset (or Basic Latin coverage, where none matches), then
 * upright over italic, then the weight closest to 400.
 * Pass an object to preload every face matching all of the descriptors given, or a
 * function to filter font faces individually.
 * @default false
 * @example { subsets: ['latin'], styles: ['normal'] }
 */
export type PreloadOption
  = | boolean
    | { subsets?: string[], styles?: string[], weights?: Array<string | number> }
    | ((fontFamily: string, font: FontFaceData) => boolean)

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
    preload: PreloadOption
    /**
     * Reduce every font file emitted to the glyphs needed to render these characters.
     * Overridden by `glyphs` on an individual family.
     *
     * Subsetting modifies the font files you ship; check that their licences allow it.
     */
    glyphs: string | string[]
    weights: Array<string | number>
    /**
     * Values to resolve variable font axes at for every family, keyed by OpenType axis tag.
     * Overridden by `variableAxis` on an individual family.
     *
     * **Experimental.** Provider support and the option shape may change.
     */
    variableAxis: VariableAxisOptions
    styles: ResolveFontOptions['styles']
    subsets: ResolveFontOptions['subsets']
    /**
     * Font formats to resolve. Defaults to `['woff2']`.
     * @default ['woff2']
     */
    formats: FontFormat[]
    /** An array applies to every generic family, overriding the per-category defaults. */
    fallbacks?: string[] | Partial<Record<GenericCSSFamily, string[]>>
  }>
  providers?: {
    adobe?: ProviderOption
    bunny?: ProviderOption
    fontshare?: ProviderOption
    fontsource?: ProviderOption
    google?: ProviderOption
    googleicons?: ProviderOption
    npm?: ProviderOption
    [key: string]: ProviderOption | undefined
  }
  /**
   * Configure how font metadata and downloaded font files are cached between builds.
   *
   * - a string or `{ dir }`: cache to this directory (relative paths are resolved from the Vite root)
   * - a storage instance (such as `unstorage`): cache with your own driver
   * - `false`: disable persistent caching (an in-memory cache is used instead)
   *
   * By default, fonts are cached in `node_modules/.cache/fontless/meta`, next to Vite's own cache directory.
   */
  cache?: false | string | { dir?: string } | FontlessStorage
  /** Configure the way font assets are exposed */
  assets?: {
    /**
     * The baseURL where font files are served.
     * @default '/assets/_fonts'
     */
    prefix?: string
    /** Currently font assets are exposed as public assets as part of the build. This will be configurable in future */
    strategy?: 'public'
  }
  /** Options passed directly to `local` font provider (none currently) */
  local?: Record<string, never>
  /** Options passed directly to `adobe` font provider */
  adobe?: typeof providers.adobe extends ProviderFactory<any, infer O> ? O : Record<string, never>
  /** Options passed directly to `bunny` font provider */
  bunny?: typeof providers.bunny extends ProviderFactory<any, infer O> ? O : Record<string, never>
  /** Options passed directly to `fontshare` font provider */
  fontshare?: typeof providers.fontshare extends ProviderFactory<any, infer O> ? O : Record<string, never>
  /** Options passed directly to `fontsource` font provider */
  fontsource?: typeof providers.fontsource extends ProviderFactory<any, infer O> ? O : Record<string, never>
  /** Options passed directly to `google` font provider */
  google?: typeof providers.google extends ProviderFactory<any, infer O> ? O : Record<string, never>
  /** Options passed directly to `googleicons` font provider */
  googleicons?: typeof providers.googleicons extends ProviderFactory<any, infer O> ? O : Record<string, never>
  /** Options passed directly to `npm` font provider */
  npm?: typeof providers.npm extends ProviderFactory<any, infer O> ? O : Record<string, never>
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
   *
   * - `false` — disable CSS variable processing
   * - `'font-prefixed-only'` — process `--font-*` CSS variables, plus any `--*-font-family` variable (such as Tailwind v4's `--default-font-family`)
   * - `true` — process all CSS variables (may have performance impact)
   * - Any custom string — process only CSS variables matching `--<prefix>*` (e.g., `'my-app'` processes `--my-app-*` variables)
   *
   * @default 'font-prefixed-only'
   */
  processCSSVariables?: boolean | 'font-prefixed-only' | (string & {})
  /**
   * Whether to throw an error when font resolution fails.
   * When false (default), font resolution failures are logged as warnings.
   * @default false
   */
  throwOnError?: boolean
  /**
   * Base URL of a `unifont` proxy to route provider API requests through, for environments
   * (browsers, web containers) that cannot call the provider APIs directly. Providers whose APIs
   * are already reachable cross-origin, such as `npm`, are unaffected.
   *
   * Defaults to `https://proxy.unifont.dev` in a browser or a StackBlitz web container, where the
   * provider APIs are unreachable anyway, and to no proxy elsewhere. Pass `false` to always
   * request the provider APIs directly.
   *
   * **Experimental.** `https://proxy.unifont.dev` is best-effort, rate-limited at the discretion
   * of the `unifont` maintainers, and may change or disappear without notice. Deploy your own if
   * you need one in production.
   * @example 'https://proxy.unifont.dev'
   */
  apiBase?: string | false
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
    processCSSVariables?: boolean | 'font-prefixed-only' | (string & {})
  }
}
