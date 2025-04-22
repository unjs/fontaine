import type { Font } from '@capsizecss/unpack'
import type { CssNode } from 'css-tree'
import { parse, walk } from 'css-tree'
import { charIn, createRegExp } from 'magic-regexp'

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

export const withoutQuotes = (str: string) => str.trim().replace(QUOTES_RE, '')

// https://developer.mozilla.org/en-US/docs/Web/CSS/font-family
const genericCSSFamilies = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'emoji',
  'math',
  'fangsong',
])

const fontProperties = new Set(['font-weight', 'font-style', 'font-stretch'])

interface FontProperties {
  'font-weight'?: string
  'font-style'?: string
  'font-stretch'?: string
}

/**
 * Extracts font family and source information from a CSS @font-face rule using css-tree.
 *
 * @param {string} css - The CSS containing @font-face rules
 * @returns Array<{ family?: string, source?: string }> - Array of objects with font family and source information
 */
export function parseFontFace(css: string | CssNode): Array<{ index: number, family: string, source?: string, properties: FontProperties }> {
  const families: Array<{ index: number, family: string, source?: string, properties: FontProperties }> = []
  const ast = typeof css === 'string' ? parse(css, { positions: true }) : css

  walk(ast, {
    visit: 'Atrule',
    enter(node) {
      if (node.name !== 'font-face')
        return

      let family: string | undefined
      const sources: string[] = []
      const properties: FontProperties = {}

      if (node.block) {
        walk(node.block, {
          visit: 'Declaration',
          enter(declaration) {
            if (declaration.property === 'font-family' && declaration.value.type === 'Value') {
              for (const child of declaration.value.children) {
                if (child.type === 'String') {
                  family = withoutQuotes(child.value)
                  break
                }
                if (child.type === 'Identifier' && !genericCSSFamilies.has(child.name)) {
                  family = child.name
                  break
                }
              }
            }

            if (fontProperties.has(declaration.property)) {
              if (declaration.value.type === 'Value') {
                const firstValue = declaration.value.children.first
                if (firstValue?.type === 'Identifier') {
                  properties[declaration.property as keyof FontProperties] = firstValue.name
                }
                else if (firstValue?.type === 'Dimension') {
                  properties[declaration.property as keyof FontProperties] = firstValue.value
                }
                else if (firstValue?.type === 'Number') {
                  properties[declaration.property as keyof FontProperties] = firstValue.value
                }
              }
            }

            if (declaration.property === 'src') {
              walk(declaration.value, {
                visit: 'Url',
                enter(urlNode) {
                  const source = withoutQuotes(urlNode.value)
                  if (source) {
                    sources.push(source)
                  }
                },
              })
            }
          },
        })
      }

      if (family) {
        for (const source of sources) {
          families.push({ index: node.loc!.start.offset, family, source, properties })
        }
        if (!sources.length) {
          families.push({ index: node.loc!.start.offset, family, properties })
        }
      }
    },
  })

  return families
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

  const sizeAdjust = fallbackMetrics && preferredFontXAvgRatio && fallbackFontXAvgRatio
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
