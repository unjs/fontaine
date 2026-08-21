import type { AtRule, Declaration, Node, Plugin, Result } from 'postcss'
import type { FontFaceMetrics } from './css'
import type { FontCategory } from './fallbacks'
import { pathToFileURL } from 'node:url'
import { parse } from 'css-tree'
import { anyOf, createRegExp, exactly } from 'magic-regexp'
import { isAbsolute } from 'pathe'
import { generateFallbackName, generateFontFace, genericCSSFamilies, parseFontFace, withoutQuotes } from './css'
import { resolveCategoryFallbacks } from './fallbacks'
import { getMetricsForFamily, readMetrics } from './metrics'

export interface FontainePostcssOptions {
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
   *
   * Families skipped this way are still given a fallback in `font-family` declarations,
   * on the assumption that the `@font-face` rule is provided elsewhere.
   * @optional
   */
  skipFontFaceGeneration?: (fallbackName: string) => boolean

  /**
   * Function to generate an unquoted font family name to use as a fallback.
   * This should return a valid CSS font family name and should not include quotes.
   * @optional
   */
  fallbackName?: (name: string) => string
}

const supportedExtensions = ['woff2', 'woff', 'ttf']

// https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Value_processing#css-wide_keywords
const cssWideKeywords = new Set(['inherit', 'initial', 'revert', 'revert-layer', 'unset'])

const RELATIVE_RE = createRegExp(
  exactly('.').or('..').and(anyOf('/', '\\')).at.lineStart(),
)

/**
 * Resolves the file a node originated from, consulting any upstream source map so that
 * relative font URLs are resolved against the stylesheet that actually declared them
 * rather than the entrypoint they were inlined into.
 */
function originatingFile(node: Node | undefined, result: Result): string | undefined {
  const source = node?.source
  if (source?.start && source.input.map) {
    const origin = source.input.origin(source.start.line, source.start.column)
    if (origin && 'file' in origin && origin.file)
      return origin.file
  }
  return source?.input.file ?? result.opts.from
}

function isFontFaceRule(node: Node | undefined): node is AtRule {
  return node?.type === 'atrule' && (node as AtRule).name.toLowerCase() === 'font-face'
}

/**
 * A PostCSS plugin that generates metric-adjusted fallback `@font-face` rules and appends
 * them to `font-family` declarations.
 *
 * Unlike {@link FontaineTransform}, this runs over fully-compiled CSS, so it sees
 * `@font-face` rules and `font-family` values produced by preprocessors such as Sass.
 */
interface FontainePlugin {
  (options: FontainePostcssOptions): Plugin
  postcss: true
}

function fontaine(options: FontainePostcssOptions): Plugin {
  const resolvePath = options.resolvePath || (id => id)
  const fallbackName = options.fallbackName || generateFallbackName
  const skipFontFaceGeneration = options.skipFontFaceGeneration || (() => false)

  function readMetricsFromId(path: string, importer: string | undefined) {
    const resolvedPath = importer && isAbsolute(importer) && RELATIVE_RE.test(path)
      ? new URL(path, pathToFileURL(importer))
      : resolvePath(path)
    return readMetrics(resolvedPath)
  }

  return {
    postcssPlugin: 'fontaine',
    async Once(root, { result, postcss }) {
      const fontFaces: AtRule[] = []
      root.walkAtRules(/^font-face$/i, rule => void fontFaces.push(rule))

      for (const rule of fontFaces) {
        for (const { family, source, properties } of parseFontFace(rule.toString())) {
          if (!supportedExtensions.some(e => source?.endsWith(e)))
            continue

          if (skipFontFaceGeneration(fallbackName(family)))
            continue

          const metrics: FontFaceMetrics | null = (await getMetricsForFamily(family))
            || (source ? await readMetricsFromId(source, originatingFile(rule, result)).catch(() => null) : null)

          if (!metrics)
            continue

          const familyFallbacks = resolveCategoryFallbacks({
            fontFamily: family,
            fallbacks: options.fallbacks,
            metrics,
            categoryFallbacks: options.categoryFallbacks,
          })

          let css = ''
          // Iterate backwards: browsers will use the last working font-face in the stylesheet
          for (let i = familyFallbacks.length - 1; i >= 0; i--) {
            const fallback = familyFallbacks[i]!
            const fallbackMetrics = await getMetricsForFamily(fallback)

            if (!fallbackMetrics)
              continue

            css = generateFontFace(metrics, {
              name: fallbackName(family),
              font: fallback,
              metrics: fallbackMetrics,
              ...properties,
            }) + css
          }

          if (!css)
            continue

          const generated = postcss.parse(css, { from: result.opts.from })
          const before = rule.raws.before
          rule.raws.before = '\n'
          generated.first!.raws.before = before
          rule.before(generated)
        }
      }

      root.walkDecls(/^font-family$/i, (decl: Declaration) => {
        if (isFontFaceRule(decl.parent as Node | undefined))
          return

        const value = parse(decl.value, { context: 'value', positions: true })
        if (value.type !== 'Value')
        /* v8 ignore next */ return

        for (const child of value.children) {
          let family: string | undefined
          if (child.type === 'String')
            family = withoutQuotes(child.value)
          else if (child.type === 'Identifier' && !cssWideKeywords.has(child.name.toLowerCase()))
            family = child.name

          if (!family)
            continue

          // The `@font-face` rule for this family may live in another stylesheet, so a
          // fallback is appended regardless of whether one was generated here.
          if (!genericCSSFamilies.has(family.toLowerCase())) {
            const offset = child.loc!.end.offset
            decl.value = `${decl.value.slice(0, offset)}, "${fallbackName(family)}"${decl.value.slice(offset)}`
          }
          return
        }
      })
    },
  }
}

const plugin: FontainePlugin = Object.assign(fontaine, { postcss: true as const })

export default plugin
