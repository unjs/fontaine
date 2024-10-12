import type { Font } from '@capsizecss/unpack'
import { charIn, charNotIn, createRegExp, exactly, whitespace } from 'magic-regexp'

// See: https://github.com/seek-oss/capsize/blob/master/packages/core/src/round.ts
function toPercentage(value: number, fractionDigits = 4) {
  const percentage = value * 100
  return `${+percentage.toFixed(fractionDigits)}%`
}

function toCSS(properties: Record<string, any>, indent = 2) {
  return Object.entries(properties)
    .map(([key, value]) => `${' '.repeat(indent)}${key}: ${value};`)
    .join('\n')
}

const QUOTES_RE = createRegExp(
  charIn('"\'').at.lineStart().or(charIn('"\'').at.lineEnd()),
  ['g'],
)

const FAMILY_RE = createRegExp(
  exactly('font-family:')
    .and(whitespace.optionally())
    .and(charNotIn(';}').times.any().as('fontFamily')),
)

const SOURCE_RE = createRegExp(
  exactly('src:')
    .and(whitespace.optionally())
    .and(charNotIn(';}').times.any().as('src')),
  ['g'],
)

const URL_RE = createRegExp(
  exactly('url(').and(charNotIn(')').times.any().as('url')).and(')'),
  ['g'],
)

export const withoutQuotes = (str: string) => str.trim().replace(QUOTES_RE, '')

export function* parseFontFace(
  css: string,
): Generator<{ family?: string, source?: string }> {
  const fontFamily = css.match(FAMILY_RE)?.groups.fontFamily
  const family = withoutQuotes(fontFamily?.split(',')[0] || '')

  for (const match of css.matchAll(SOURCE_RE)) {
    const sources = match.groups.src?.split(',')
    for (const entry of sources /* c8 ignore next */ || []) {
      for (const url of entry.matchAll(URL_RE)) {
        const source = withoutQuotes(url.groups?.url || '')
        if (source)
          yield { family, source }
      }
    }
  }

  yield { family: '', source: '' }
}

/**
 * Generates a fallback name based on the first font family specified in the input string.
 * @param {string} name - The full font family string.
 * @returns {string} - The fallback font name.
 */
export function generateFallbackName(name: string) {
  const firstFamily = withoutQuotes(name.split(',').shift()!)
  return `${firstFamily} fallback`
}

interface FallbackOptions {
  /**
   * The name of the fallback font.
   */
  name: string

  /**
   * The fallback font family name.
   */
  font: string

  /**
   * Metrics for fallback face calculations.
   * @optional
   */
  metrics?: FontFaceMetrics

  /**
   * Additional properties that may be included dynamically
   */
  [key: string]: any
}

export type FontFaceMetrics = Pick<
  Font,
  'ascent' | 'descent' | 'lineGap' | 'unitsPerEm' | 'xWidthAvg'
>

/**
 * Generates a CSS `@font-face' declaration for a font, taking fallback and resizing into account.
 * @param {FontFaceMetrics} metrics - The metrics of the preferred font. See {@link FontFaceMetrics}.
 * @param {FallbackOptions} fallback - The fallback options, including name, font and optional metrics. See {@link FallbackOptions}.
 * @returns {string} - The full `@font-face` CSS declaration.
 */
export function generateFontFace(metrics: FontFaceMetrics, fallback: FallbackOptions) {
  const { name: fallbackName, font: fallbackFontName, metrics: fallbackMetrics, ...properties } = fallback

  // Credits to: https://github.com/seek-oss/capsize/blob/master/packages/core/src/createFontStack.ts

  // Calculate size adjust
  const preferredFontXAvgRatio = metrics.xWidthAvg / metrics.unitsPerEm
  const fallbackFontXAvgRatio = fallbackMetrics
    ? fallbackMetrics.xWidthAvg / fallbackMetrics.unitsPerEm
    : 1

  const sizeAdjust
    = fallbackMetrics && preferredFontXAvgRatio && fallbackFontXAvgRatio
      ? preferredFontXAvgRatio / fallbackFontXAvgRatio
      : 1

  const adjustedEmSquare = metrics.unitsPerEm * sizeAdjust

  // Calculate metric overrides for preferred font
  const ascentOverride = metrics.ascent / adjustedEmSquare
  const descentOverride = Math.abs(metrics.descent) / adjustedEmSquare
  const lineGapOverride = metrics.lineGap / adjustedEmSquare

  const declaration = {
    'font-family': JSON.stringify(fallbackName),
    'src': `local(${JSON.stringify(fallbackFontName)})`,
    'size-adjust': toPercentage(sizeAdjust),
    'ascent-override': toPercentage(ascentOverride),
    'descent-override': toPercentage(descentOverride),
    'line-gap-override': toPercentage(lineGapOverride),
    ...properties,
  }

  return `@font-face {\n${toCSS(declaration)}\n}\n`
}
