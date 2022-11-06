import { createUnplugin } from 'unplugin'
import {
  anyOf,
  createRegExp,
  exactly,
  charIn,
  charNotIn,
  whitespace,
} from 'magic-regexp'
import MagicString from 'magic-string'
import { generateFontFace, parseFontFace, generateFallbackName } from './css'
import { getMetricsForFamily, readMetrics } from './metrics'
import { parseURL } from 'ufo'
import { isAbsolute, join } from 'pathe'

interface FontaineTransformOptions {
  css?: { value?: string }
  fallbacks: string[]
  resolvePath?: (path: string) => string | URL
  /** this should produce an unquoted font family name */
  fallbackName?: (name: string) => string
  /** @deprecated use fallbackName */
  overrideName?: (name: string) => string
  sourcemap?: boolean
}

const supportedExtensions = ['woff2', 'woff', 'ttf']

export const FontaineTransform = createUnplugin(
  (options: FontaineTransformOptions) => {
    const cssContext = (options.css = options.css || {})
    cssContext.value = ''
    const resolvePath = options.resolvePath || (id => id)
    const fallbackName =
      options.fallbackName || options.overrideName || generateFallbackName

    function readMetricsFromId(path: string, importer: string) {
      const resolvedPath =
        isAbsolute(importer) && path.startsWith('.')
          ? join(importer, path)
          : resolvePath(path)
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
          if (match.index === undefined || !matchContent) continue

          faceRanges.push([match.index, match.index + matchContent.length])

          for (const { family, source } of parseFontFace(matchContent)) {
            if (!family) continue
            if (!supportedExtensions.some(e => source?.endsWith(e))) continue

            const metrics =
              (await getMetricsForFamily(family)) ||
              (source &&
                (await readMetricsFromId(source, id).catch(() => null)))

            if (metrics) {
              const fontFace = generateFontFace(metrics, {
                name: fallbackName(family),
                fallbacks: options.fallbacks,
              })
              cssContext.value += fontFace
              s.appendLeft(match.index, fontFace)
            }
          }
        }

        for (const match of code.matchAll(FONT_FAMILY_RE)) {
          const { index, 0: matchContent } = match
          if (index === undefined || !matchContent) continue

          // Skip font-family definitions _within_ @font-face blocks
          if (faceRanges.some(([start, end]) => index > start && index < end))
            continue
          const families = matchContent
            .split(',')
            .map(f => f.trim())
            .filter(f => !f.startsWith('var('))

          if (!families.length) continue

          s.overwrite(
            index,
            index + matchContent.length,
            ' ' +
              [
                families[0],
                `"${generateFallbackName(families[0])}"`,
                ...families.slice(1),
              ].join(', ')
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
  }
)

const FONT_FACE_RE = createRegExp(
  exactly('@font-face')
    .and(whitespace.times.any())
    .and('{')
    .and(charNotIn('}').times.any())
    .and('}'),
  ['g']
)

const FONT_FAMILY_RE = createRegExp(
  charNotIn(';}')
    .times.any()
    .as('family')
    .after(exactly('font-family:').and(whitespace.times.any()))
    .before(charIn(';}').or(exactly('').at.lineEnd())),
  ['g']
)

const CSS_RE = createRegExp(
  exactly('.').and(anyOf('sass', 'css', 'scss')).at.lineEnd()
)
