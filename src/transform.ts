import { createUnplugin } from 'unplugin'
import {
  createRegExp,
  exactly,
  charIn,
  charNotIn,
  whitespace,
} from 'magic-regexp'
import MagicString from 'magic-string'
import { generateFontFace, parseFontFace, generateOverrideName } from './css'
import { getMetricsForFamily, readMetrics } from './metrics'
import { parseURL } from 'ufo'

interface FontaineTransformOptions {
  css?: { value?: string }
  fallbacks: string[]
  resolvePath?: (path: string) => string | URL
  sourcemap?: boolean
}

export const FontaineTransform = createUnplugin(
  (options: FontaineTransformOptions) => {
    const cssContext = (options.css = options.css || {})
    cssContext.value = ''
    return {
      name: 'fontaine-transform',
      enforce: 'pre',
      transformInclude(id) {
        const { pathname } = parseURL(id)
        return pathname.endsWith('.css') || id.endsWith('.css')
      },
      async transform(code, id) {
        const s = new MagicString(code)
        const faceRanges: [start: number, end: number][] = []

        for (const match of code.matchAll(FONT_FACE_RE)) {
          const matchContent = match[0]
          if (match.index === undefined || !matchContent) continue

          faceRanges.push([match.index, match.index + matchContent.length])

          const { family, source } = parseFontFace(matchContent)
          if (!family) continue

          const metrics =
            (await getMetricsForFamily(family)) ||
            (source
              ? await readMetrics(
                  options.resolvePath ? options.resolvePath(source) : source
                ).catch(() => null)
              : null)

          if (metrics) {
            const fontFace = generateFontFace(metrics, {
              name: generateOverrideName(family),
              fallbacks: options.fallbacks,
            })
            cssContext.value += fontFace
            s.appendLeft(match.index, fontFace)
          }
        }

        for (const match of code.matchAll(FONT_FAMILY_RE)) {
          const { index, 0: matchContent } = match
          if (index === undefined || !matchContent) continue

          // Skip font-family definitions _within_ @font-face blocks
          if (faceRanges.some(([start, end]) => index > start && index < end))
            continue
          const families = matchContent.split(',').map(f => f.trim())

          s.overwrite(
            index,
            index + matchContent.length,
            ' ' +
              [
                families[0],
                `"${generateOverrideName(families[0])}"`,
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
