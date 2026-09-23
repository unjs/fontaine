import type { FontFaceData } from 'unifont'
import type { VariationAxes } from './subset'
import type { RawFontFaceData, ResolvedVariableAxisOptions } from './types'
import { fileURLToPath } from 'node:url'
import { hash } from 'ohash'
import { extname, relative } from 'pathe'
import { filename } from 'pathe/utils'
import { hasProtocol, joinRelativeURL, joinURL } from 'ufo'
import { formatToExtension, parseFont } from './css/render'
import { glyphsToUnicodeRange, resolveVariationAxes, unicodeRangeToText, withoutVariationSettings } from './subset'

function hashableSource(context: NormalizeFontDataContext, source: { url: string }) {
  if (!source.url.startsWith('file://') || !context.root) {
    return source
  }
  return { ...source, url: relative(context.root, fileURLToPath(source.url)) }
}

function toArray<T>(value?: T | T[]): T[] {
  return !value || Array.isArray(value) ? value as T[] : [value]
}

/** A remote font to download, keyed in `renderedFontURLs` by the file name it will be emitted as. */
export interface RenderedFont {
  url: string
  /** `RequestInit` the provider requires for this font, such as authorization headers. */
  init?: RequestInit
  /** Characters the emitted file should be reduced to, if the family sets `glyphs`. */
  subset?: string
  /** Variable font axes to apply to the emitted file, if the family sets `variableAxis`. */
  variationAxes?: VariationAxes
}

export interface NormalizeFontDataOptions {
  /** Normalised characters to subset the emitted files to. */
  glyphs?: string
  /** How each requested variable font axis was resolved, and so what is left to apply here. */
  variableAxis?: ResolvedVariableAxisOptions
}

export interface NormalizeFontDataContext {
  dev: boolean
  renderedFontURLs: Map<string, RenderedFont>
  assetsBaseURL: string
  /**
   * Project root, used to keep emitted file names for local (`file:`) fonts stable
   * across machines, whose absolute paths differ.
   */
  root?: string
  /**
   * Public URL prefix that `assetsBaseURL` is served under, i.e. Vite's `base`.
   *
   * Only used when the URL is generated here rather than by `resolveAssetURL`, so it must
   * be a path or an absolute URL; a relative base cannot be resolved without knowing the
   * URL of the stylesheet the font is referenced from.
   * @default '/'
   */
  baseURL?: string
  /**
   * Return the URL to embed in generated CSS for a font that will be emitted as `file`.
   *
   * Used during build to hand the font to Vite's asset pipeline (so `base`, a relative
   * base and `experimental.renderBuiltUrl` are all applied to it). Returning `undefined`
   * falls back to joining `baseURL` and `assetsBaseURL` with the file name.
   */
  resolveAssetURL?: (file: string, url: string) => string | undefined
  callback?: (filename: string, url: string) => void
}

export function normalizeFontData(context: NormalizeFontDataContext, faces: RawFontFaceData | FontFaceData[], options: NormalizeFontDataOptions = {}): FontFaceData[] {
  const data: FontFaceData[] = []
  for (const face of toArray<RawFontFaceData | FontFaceData>(faces)) {
    let subsetted = false
    const unicodeRange = toArray(face.unicodeRange)
    const requested = options.variableAxis && resolveVariationAxes(options.variableAxis)
    // Instancing means subsetting, so it needs a glyph list: the family's own, or the
    // characters the face declares it can render.
    const glyphs = requested || !isCoveredBy(unicodeRange, options.glyphs) ? options.glyphs : undefined
    const text = glyphs ?? (requested ? unicodeRangeToText(unicodeRange) : undefined)
    const variationAxes = text ? requested?.axes : undefined
    const src = toArray(face.src).map((src) => {
      const source = typeof src === 'string' ? parseFont(src) : src
      if ('url' in source && hasProtocol(source.url, { acceptRelative: true })) {
        source.url = source.url.replace(/^\/\//, 'https://')
        const _url = source.url.replace(/\?.*/, '')
        const MAX_FILENAME_PREFIX_LENGTH = 50
        const file = [
          // TODO: investigate why negative ignore pattern below is being ignored
          hash(filename(_url) || _url).replace(/^-+/, '').slice(0, MAX_FILENAME_PREFIX_LENGTH),
          hash(text || variationAxes
            ? { source: hashableSource(context, source), ...(text && { glyphs: text }), ...(variationAxes && { variationAxes }) }
            : hashableSource(context, source)).replace(/-/, '_') + (extname(source.url) || formatToExtension(source.format) || ''),
        ].filter(Boolean).join('-')

        context.renderedFontURLs.set(file, { url: source.url, init: face.meta?.init, subset: text, variationAxes })
        subsetted ||= Boolean(text)
        source.originalURL = source.url

        const baseURL = context.baseURL || '/'
        source.url = context.resolveAssetURL?.(file, source.url)
          ?? (context.dev
            ? joinRelativeURL(baseURL, context.assetsBaseURL, file)
            : joinURL(baseURL, context.assetsBaseURL, file))

        context.callback?.(file, source.url)
      }

      return source
    })

    data.push({
      ...face,
      // A locally subsetted file only contains the requested glyphs, and browsers do not
      // fall through to another face of the same family for a glyph the matched face is
      // missing, so the face has to declare what it can render.
      unicodeRange: unicodeRange ?? (subsetted && glyphs ? glyphsToUnicodeRange(glyphs) : undefined),
      // An axis pinned in the file itself no longer exists to be varied.
      variationSettings: subsetted && variationAxes && requested
        ? withoutVariationSettings(face.variationSettings, requested.pinned)
        : face.variationSettings,
      src,
    })
  }
  return data
}

/** Whether every codepoint `unicodeRange` declares is in `glyphs`, so subsetting to them would remove nothing. */
function isCoveredBy(unicodeRange: string[] | undefined, glyphs: string | undefined): boolean {
  if (!unicodeRange?.length || !glyphs) {
    return false
  }
  const declared = unicodeRangeToText(unicodeRange, glyphs.length)
  if (declared === undefined) {
    return false
  }
  const available = new Set(glyphs)
  return [...declared].every(character => available.has(character))
}
