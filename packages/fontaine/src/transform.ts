import type { CssNode } from 'css-tree'
import type { FontCategory } from './fallbacks'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parse, walk } from 'css-tree'
import { anyOf, char, createRegExp, exactly, oneOrMore } from 'magic-regexp'
import MagicString from 'magic-string'

import { isAbsolute } from 'pathe'
import { createUnplugin } from 'unplugin'
import { generateFallbackName, generateFontFace, parseFontFace, withoutQuotes } from './css'
import { resolveCategoryFallbacks } from './fallbacks'
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

interface CssImport {
  specifier: string
  end: number
}

function extractCssImports(ast: CssNode): CssImport[] {
  const imports: CssImport[] = []
  walk(ast, {
    visit: 'Atrule',
    enter(node) {
      if (node.name !== 'import' || !node.prelude)
        return
      walk(node.prelude, (child) => {
        let specifier: string | undefined
        if (child.type === 'String')
          specifier = withoutQuotes(child.value)
        else if (child.type === 'Url')
          specifier = withoutQuotes(child.value)
        if (specifier && !specifier.startsWith('http:') && !specifier.startsWith('https:') && !specifier.startsWith('data:')) {
          imports.push({ specifier: specifier.replace(/[?#].*$/, ''), end: node.loc!.end.offset })
        }
      })
    },
  })
  return imports
}

function resolveCssImport(specifier: string, importer: string): string | undefined {
  try {
    if (RELATIVE_RE.test(specifier) || isAbsolute(specifier))
      return fileURLToPath(new URL(specifier, pathToFileURL(importer)))
    return createRequire(importer).resolve(specifier)
  }
  catch {
    return undefined
  }
}

/**
 * Transforms CSS files to include font fallbacks.
 *
 * @param options - The transformation options. See {@link FontaineTransformOptions}.
 * @returns The unplugin instance.
 */
export const FontaineTransform: ReturnType<typeof createUnplugin<FontaineTransformOptions>> = createUnplugin((options: FontaineTransformOptions) => {
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
    transform: {
      filter: {
        id: [CSS_RE],
      },
      async handler(code, id) {
        const s = new MagicString(code)
        const inserted = new Set<string>()

        const ast = parse(code, { positions: true })

        const fontFaces = parseFontFace(ast).map(face => ({ ...face, importer: id, prefix: '' }))

        if (isAbsolute(id)) {
          const imports = extractCssImports(ast)
          const insertionIndex = imports.length ? Math.max(...imports.map(i => i.end)) : 0
          const seen = new Set([id])
          const queue = imports.map(i => ({ specifier: i.specifier, importer: id, depth: 0 }))

          while (queue.length) {
            const { specifier, importer, depth } = queue.shift()!
            const resolved = resolveCssImport(specifier, importer)
            if (!resolved || seen.has(resolved) || !CSS_RE.test(resolved))
              continue
            seen.add(resolved)

            const importedCss = await readFile(resolved, 'utf-8').catch(() => null)
            if (importedCss === null)
              continue

            const importedAst = parse(importedCss, { positions: true })
            for (const face of parseFontFace(importedAst)) {
              fontFaces.push({ ...face, index: insertionIndex, importer: resolved, prefix: '\n' })
            }
            if (depth < 5) {
              for (const nested of extractCssImports(importedAst)) {
                queue.push({ specifier: nested.specifier, importer: resolved, depth: depth + 1 })
              }
            }
          }
        }

        for (const { family, source, index, properties, importer, prefix } of fontFaces) {
          if (!supportedExtensions.some(e => source?.endsWith(e)))
            continue
          if (skipFontFaceGeneration(fallbackName(family)))
            continue

          const metrics = (await getMetricsForFamily(family)) || (source && (await readMetricsFromId(source, importer).catch(() => null)))

          /* v8 ignore next 2 */
          if (!metrics)
            continue

          const familyFallbacks = resolveCategoryFallbacks({
            fontFamily: family,
            fallbacks: options.fallbacks,
            metrics,
            categoryFallbacks: options.categoryFallbacks,
          })

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
            const key = `${index}:${fontFace}`
            if (inserted.has(key))
              continue
            inserted.add(key)

            cssContext.value += fontFace
            s.appendLeft(index, prefix + fontFace)
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
