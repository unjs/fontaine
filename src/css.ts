import type { Font } from '@capsizecss/unpack'
import {
  createRegExp,
  charIn,
  charNotIn,
  exactly,
  whitespace,
} from 'magic-regexp'

export function* parseFontFace(
  css: string
): Generator<{ family?: string; source?: string }> {
  const fontFamily = css.match(FAMILY_RE)?.groups.fontFamily
  const family = withoutQuotes(fontFamily?.split(',')[0] || '')

  for (const match of css.matchAll(SOURCE_RE)) {
    const sources = match.groups.src?.split(',')
    for (const entry of sources /* c8 ignore next */ || []) {
      for (const url of entry.matchAll(URL_RE)) {
        const source = withoutQuotes(url.groups?.url || '')
        if (source) {
          yield { family, source }
        }
      }
    }
  }

  yield { family: '', source: '' }
}

export const generateFallbackName = (name: string) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const firstFamily = withoutQuotes(name.split(',').shift()!)
  return `${firstFamily} fallback`
}

export const withoutQuotes = (str: string) => str.trim().replace(QUOTES_RE, '')

export type FontFaceMetrics = Pick<
  Font,
  'ascent' | 'descent' | 'lineGap' | 'unitsPerEm' | 'xWidthAvg'
>

export const generateFontFace = (
  metrics: FontFaceMetrics,
  fallbackMetrics: FontFaceMetrics,
  fallbackName: string,
  fallbackFont: string
) => {
  // Credits to: https://github.com/seek-oss/capsize/blob/master/packages/core/src/createFontStack.ts

  // Calculate size adjust
  const preferredFontXAvgRatio = metrics.xWidthAvg / metrics.unitsPerEm
  const fallbackFontXAvgRatio =
    fallbackMetrics.xWidthAvg / fallbackMetrics.unitsPerEm

  const sizeAdjust =
    preferredFontXAvgRatio && fallbackFontXAvgRatio
      ? preferredFontXAvgRatio / fallbackFontXAvgRatio
      : 1

  const adjustedEmSquare = metrics.unitsPerEm * sizeAdjust

  // Calculate metric overrides for preferred font
  const ascentOverride = metrics.ascent / adjustedEmSquare
  const descentOverride = Math.abs(metrics.descent) / adjustedEmSquare
  const lineGapOverride = metrics.lineGap / adjustedEmSquare

  const declaration = {
    'font-family': `'${fallbackName}'`,
    src: `local('${fallbackFont}')`,
    'size-adjust': toPercentage(sizeAdjust),
    'ascent-override': toPercentage(ascentOverride),
    'descent-override': toPercentage(descentOverride),
    'line-gap-override': toPercentage(lineGapOverride),
  }

  return `@font-face {\n${toCSS(declaration)}\n}\n`
}

// See: https://github.com/seek-oss/capsize/blob/master/packages/core/src/round.ts
const toPercentage = (value: number, fractionDigits = 4) => {
  const percentage = value * 100
  return +percentage.toFixed(fractionDigits) + '%'
}

const toCSS = (properties: Record<string, any>, indent = 2) =>
  Object.entries(properties)
    .map(([key, value]) => ' '.repeat(indent) + `${key}: ${value};`)
    .join('\n')

const QUOTES_RE = createRegExp(
  charIn('"\'').at.lineStart().or(charIn('"\'').at.lineEnd()),
  ['g']
)

const FAMILY_RE = createRegExp(
  exactly('font-family:')
    .and(whitespace.optionally())
    .and(charNotIn(';}').times.any().as('fontFamily'))
)

const SOURCE_RE = createRegExp(
  exactly('src:')
    .and(whitespace.optionally())
    .and(charNotIn(';}').times.any().as('src')),
  ['g']
)

const URL_RE = createRegExp(
  exactly('url(').and(charNotIn(')').times.any().as('url')).and(')'),
  ['g']
)
