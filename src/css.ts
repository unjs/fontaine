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
    const sources = match.groups.src?.split(',') || []
    for (const entry of sources) {
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

interface GenerateOptions {
  name: string
  fallbacks: string[]
  [key: string]: any
}

export const generateFontFace = (metrics: Font, options: GenerateOptions) => {
  const { name, fallbacks, ...properties } = options

  // TODO: implement size-adjust: 'width' of web font / 'width' of fallback font
  const sizeAdjust = 1

  const declaration = {
    'font-family': JSON.stringify(name),
    src: fallbacks.map(f => `local(${JSON.stringify(f)})`),
    // 'size-adjust': toPercentage(sizeAdjust),
    'ascent-override': toPercentage(
      metrics.ascent / (metrics.unitsPerEm * sizeAdjust)
    ),
    'descent-override': toPercentage(
      Math.abs(metrics.descent / (metrics.unitsPerEm * sizeAdjust))
    ),
    'line-gap-override': toPercentage(
      metrics.lineGap / (metrics.unitsPerEm * sizeAdjust)
    ),
    ...properties,
  }

  return `@font-face {\n${toCSS(declaration)}\n}\n`
}

const toPercentage = (value: number, fractionDigits = 8) => {
  const percentage = value * 100
  return (
    (percentage % 1
      ? percentage.toFixed(fractionDigits).replace(/0+$/, '')
      : percentage) + '%'
  )
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
