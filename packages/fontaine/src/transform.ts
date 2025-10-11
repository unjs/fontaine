import { pathToFileURL } from 'node:url'
import { parse, walk } from 'css-tree'
import { anyOf, char, createRegExp, exactly, oneOrMore } from 'magic-regexp'
import MagicString from 'magic-string'
import { isAbsolute } from 'pathe'

import { createUnplugin } from 'unplugin'
import { generateFallbackName, generateFontFace, parseFontFace, withoutQuotes } from './css'
import { getMetricsForFamily, readMetrics } from './metrics'

export type FontCategory = 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting'

export const DEFAULT_CATEGORY_FALLBACKS: Record<FontCategory, string[]> = {
  'sans-serif': ['BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'Noto Sans'],
  'serif': ['Times New Roman', 'Georgia', 'Noto Serif'],
  'monospace': ['Courier New', 'Roboto Mono', 'Noto Sans Mono'],
  'display': ['BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'Noto Sans'],
  'handwriting': ['BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'Noto Sans'],
}

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
   * Font family fallbacks to use.
   * Can be an array of fallback font family names to use for all fonts,
   * or an object where keys are font family names and values are arrays of fallback font families.
   */
  fallbacks: string[] | Record<string, string[]>

  /**
   * Category-specific fallback font stacks.
   * When a font's category is detected (serif, sans-serif, monospace, etc.),
   * these fallbacks will be used if no explicit per-family override is provided.
   * @optional
   */
  categoryFallbacks?: Partial<Record<FontCategory, string[]>>

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

const CSS_RE = createRegExp(
  exactly('.')
    .and(anyOf('sass', 'css', 'scss'))
    // Match query strings
    .and(exactly('?').and(oneOrMore(char)).optionally())
    .at.lineEnd(),
)

const RELATIVE_RE = createRegExp(
  exactly('.').or('..').and(anyOf('/', '\\')).at.lineStart(),
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

  // Merge user-provided category fallbacks with defaults
  const mergedCategoryFallbacks = { ...DEFAULT_CATEGORY_FALLBACKS }
  if (options.categoryFallbacks) {
    for (const category in options.categoryFallbacks) {
      const categoryKey = category as FontCategory
      const fallbacks = options.categoryFallbacks[categoryKey]
      if (fallbacks) {
        mergedCategoryFallbacks[categoryKey] = fallbacks
      }
    }
  }

  function getFallbacksForFamily(family: string, metrics?: { category?: string } | null): string[] {
    // 1. If fallbacks is an array, use it as a global override (legacy behavior)
    if (Array.isArray(options.fallbacks)) {
      return options.fallbacks
    }

    // 2. Return explicit per-family overrides when supplied (object notation)
    const familyFallback = options.fallbacks[family]
    if (familyFallback) {
      return familyFallback
    }

    // 3. If metrics have a category, return the merged preset for that category
    if (metrics?.category) {
      const categoryFallback = mergedCategoryFallbacks[metrics.category as FontCategory]
      if (categoryFallback) {
        return categoryFallback
      }
    }

    // 4. Fallback to sans-serif preset
    return mergedCategoryFallbacks['sans-serif']
  }

  function readMetricsFromId(path: string, importer: string) {
    const resolvedPath = isAbsolute(importer) && RELATIVE_RE.test(path)
      ? new URL(path, pathToFileURL(importer))
      : resolvePath(path)
    return readMetrics(resolvedPath)
  }

  return {
    name: 'fontaine-transform',
    enforce: 'pre',
    transform: {
      filter: {
        id: [CSS_RE],
      },
      async handler(code, id) {
        const s = new MagicString(code)

        const ast = parse(code, { positions: true })

        for (const { family, source, index, properties } of parseFontFace(ast)) {
          if (!supportedExtensions.some(e => source?.endsWith(e)))
            continue
          if (skipFontFaceGeneration(fallbackName(family)))
            continue

          const metrics = (await getMetricsForFamily(family)) || (source && (await readMetricsFromId(source, id).catch(() => null)))

          /* v8 ignore next 2 */
          if (!metrics)
            continue

          const familyFallbacks = getFallbacksForFamily(family, metrics)

          // Iterate backwards: Browsers will use the last working font-face in the stylesheet
          for (let i = familyFallbacks.length - 1; i >= 0; i--) {
            const fallback = familyFallbacks[i]!
            const fallbackMetrics = await getMetricsForFamily(fallback)

            if (!fallbackMetrics)
              continue

            const fontFace = generateFontFace(metrics, {
              name: fallbackName(family),
              font: fallback,
              metrics: fallbackMetrics,
              ...properties,
            })
            cssContext.value += fontFace
            s.appendLeft(index, fontFace)
          }
        }

        walk(ast, {
          visit: 'Declaration',
          enter(node) {
            if (node.property !== 'font-family')
              return
            if (this.atrule && this.atrule.name === 'font-face')
              return
            if (node.value.type !== 'Value')
            /* v8 ignore next */ return

            for (const child of node.value.children) {
              let family: string | undefined
              if (child.type === 'String') {
                family = withoutQuotes(child.value)
              }
              else if (child.type === 'Identifier' && child.name !== 'inherit') {
                family = child.name
              }

              if (!family)
                continue

              s.appendRight(child.loc!.end.offset, `, "${fallbackName(family)}"`)
              return
            }
          },
        })

        if (s.hasChanged()) {
          return {
            code: s.toString(),
            /* v8 ignore next 3 */
            map: options.sourcemap
              ? s.generateMap({ source: id, includeContent: true })
              : undefined,
          }
        }
      },
    },
  }
})
