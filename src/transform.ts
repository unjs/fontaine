import { anyOf, charIn, charNotIn, createRegExp, exactly, whitespace } from 'magic-regexp'
import MagicString from 'magic-string'
import { isAbsolute, join } from 'pathe'
import { parseURL } from 'ufo'
import { createUnplugin } from 'unplugin'

import { generateFallbackName, generateFontFace, parseFontFace } from './css'
import { getMetricsForFamily, readMetrics } from './metrics'

export interface FontaineTransformOptions {
  /**
   * Configuration options for the CSS transformation.
   * @optional
   */
  css?: {
    /**
     * Holds the current value of the CSS being transformed.
     * @optional
     */
    value?: string
  }

  /**
   * An array of fallback font family names to use.
   */
  fallbacks: string[]

  /**
   * Function to resolve a given path to a valid URL or local path.
   * This is typically used to resolve font file paths.
   * @optional
   */
  resolvePath?: (path: string) => string | URL

  /**
   * A function to determine whether to skip font face generation for a given fallback name.
   * @optional
   */
  skipFontFaceGeneration?: (fallbackName: string) => boolean

  /**
   * Function to generate an unquoted font family name to use as a fallback.
   * This should return a valid CSS font family name and should not include quotes.
   * @optional
   */
  fallbackName?: (name: string) => string
  /** @deprecated use fallbackName */
  overrideName?: (name: string) => string

  /**
   * Specifies whether to create a source map for the transformation.
   * @optional
   */
  sourcemap?: boolean
}

const supportedExtensions = ['woff2', 'woff', 'ttf']

const FONT_FACE_RE = createRegExp(
  exactly('@font-face')
    .and(whitespace.times.any())
    .and('{')
    .and(charNotIn('}').times.any())
    .and('}'),
  ['g'],
)

const FONT_FAMILY_RE = createRegExp(
  charNotIn(';}')
    .times.any()
    .as('family')
    .after(exactly('font-family:').and(whitespace.times.any()))
    .before(charIn(';}').or(exactly('').at.lineEnd())),
  ['g'],
)

const CSS_RE = createRegExp(
  exactly('.')
    .and(anyOf('sass', 'css', 'scss'))
    .at.lineEnd(),
)

/**
 * Transforms CSS files to include font fallbacks.
 *
 * @param options - The transformation options. See {@link FontaineTransformOptions}.
 * @returns The unplugin instance.
 */
export const FontaineTransform = createUnplugin((options: FontaineTransformOptions) => {
  const cssContext = (options.css = options.css || {})
  cssContext.value = ''
  const resolvePath = options.resolvePath || (id => id)
  const fallbackName = options.fallbackName || options.overrideName || generateFallbackName

  const skipFontFaceGeneration = options.skipFontFaceGeneration || (() => false)

  function readMetricsFromId(path: string, importer: string) {
    const resolvedPath = isAbsolute(importer) && path.startsWith('.') ? join(importer, path) : resolvePath(path)
    return readMetrics(resolvedPath)
  }

  return {
    name: 'fontaine-transform',
    enforce: 'pre',
    transformInclude(id) {
      const { pathname } = parseURL(id)
      return CSS_RE.test(pathname) || CSS_RE.test(id)
    },
    async transform(code, id) {
      const s = new MagicString(code)
      const faceRanges: [start: number, end: number][] = []

      for (const match of code.matchAll(FONT_FACE_RE)) {
        const matchContent = match[0]
        if (match.index === undefined || !matchContent)
          continue

        faceRanges.push([match.index, match.index + matchContent.length])

        for (const { family, source } of parseFontFace(matchContent)) {
          if (!family)
            continue
          if (!supportedExtensions.some(e => source?.endsWith(e)))
            continue
          if (skipFontFaceGeneration(fallbackName(family)))
            continue

          const metrics = (await getMetricsForFamily(family)) || (source && (await readMetricsFromId(source, id).catch(() => null)))

          if (!metrics)
            continue

          // Iterate backwards: Browsers will use the last working font-face in the stylesheet
          for (let i = options.fallbacks.length - 1; i >= 0; i--) {
            const fallback = options.fallbacks[i]
            const fallbackMetrics = await getMetricsForFamily(fallback)

            if (!fallbackMetrics)
              continue

            const fontFace = generateFontFace(metrics, {
              name: fallbackName(family),
              font: fallback,
              metrics: fallbackMetrics,
            })
            cssContext.value += fontFace
            s.appendLeft(match.index, fontFace)
          }
        }
      }

      for (const match of code.matchAll(FONT_FAMILY_RE)) {
        const { index, 0: matchContent } = match
        if (index === undefined || !matchContent)
          continue

        // Skip font-family definitions _within_ @font-face blocks
        if (faceRanges.some(([start, end]) => index > start && index < end))
          continue
        const families = matchContent
          .split(',')
          .map(f => f.trim())
          .filter(f => !f.startsWith('var('))

        if (!families.length || families[0] === 'inherit')
          continue

        s.overwrite(
          index,
          index + matchContent.length,
          ` ${
            [
              families[0],
              `"${generateFallbackName(families[0])}"`,
              ...families.slice(1),
            ].join(', ')}`,
        )
      }

      if (s.hasChanged()) {
        return {
          code: s.toString(),
          map: options.sourcemap
            ? s.generateMap({ source: id, includeContent: true })
            : undefined,
        }
      }
    },
  }
})
