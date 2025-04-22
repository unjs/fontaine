import { pathToFileURL } from 'node:url'
import { parse, walk } from 'css-tree'
import { anyOf, createRegExp, exactly } from 'magic-regexp'
import MagicString from 'magic-string'
import { isAbsolute } from 'pathe'

import { parseURL } from 'ufo'
import { createUnplugin } from 'unplugin'
import { generateFallbackName, generateFontFace, parseFontFace, withoutQuotes } from './css'
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

const CSS_RE = createRegExp(
  exactly('.')
    .and(anyOf('sass', 'css', 'scss'))
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

  function readMetricsFromId(path: string, importer: string) {
    const resolvedPath = isAbsolute(importer) && RELATIVE_RE.test(path)
      ? new URL(path, pathToFileURL(importer))
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

      const ast = parse(code, { positions: true })

      for (const { family, source, index } of parseFontFace(ast)) {
        if (!supportedExtensions.some(e => source?.endsWith(e)))
          continue
        if (skipFontFaceGeneration(fallbackName(family)))
          continue

        const metrics = (await getMetricsForFamily(family)) || (source && (await readMetricsFromId(source, id).catch(() => null)))

        /* v8 ignore next 2 */
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
  }
})
