import type { Font } from '@capsizecss/unpack'
import type { FontFaceMetrics } from './css'

import { isAbsolute } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { fromUrl } from '@capsizecss/unpack'
import { fromFile } from '@capsizecss/unpack/fs'

import { isStylesheetRelative, withoutQuotes } from './css'

const metricCache: Record<string, FontFaceMetrics | null> = {}

type RequiredFontMetrics = Pick<Font, 'ascent' | 'descent' | 'lineGap' | 'unitsPerEm' | 'xWidthAvg'> & { category?: string }

function filterRequiredMetrics(font: RequiredFontMetrics): FontFaceMetrics {
  return {
    ascent: font.ascent,
    descent: font.descent,
    lineGap: font.lineGap,
    unitsPerEm: font.unitsPerEm,
    xWidthAvg: font.xWidthAvg,
    category: font.category,
  }
}

/**
 * Retrieves the font metrics for a given font family from the metrics collection. Uses caching to avoid redundant calculations.
 * @param {string} family - The name of the font family for which metrics are requested.
 * @returns {Promise<FontFaceMetrics | null>} - A promise that resolves with the filtered font metrics or null if not found. See {@link FontFaceMetrics}.
 * @async
 */
export async function getMetricsForFamily(family: string): Promise<FontFaceMetrics | null> {
  family = withoutQuotes(family)

  if (family in metricCache)
    return metricCache[family] ?? null

  try {
    const name = fontFamilyToCamelCase(family)
    const { entireMetricsCollection } = await import('#capsize-font-metrics') as any as typeof import('@capsizecss/metrics/entireMetricsCollection')
    const metrics = entireMetricsCollection[name as keyof typeof entireMetricsCollection]

    /* v8 ignore next 4 */
    if (!('descent' in metrics)) {
      metricCache[family] = null
      return null
    }

    const filteredMetrics = filterRequiredMetrics(metrics)
    metricCache[family] = filteredMetrics
    return filteredMetrics
  }
  catch {
    metricCache[family] = null
    return null
  }
}

const urlRequestCache = new Map<string, Promise<Font>>()

/**
 * Reads font metrics from a source URL, which may be a `file:` URL or a remote one. A string
 * that is not a URL, such as a bare path or a root-relative one, resolves to `null`.
 * It caches the results to optimise subsequent requests for the same source.
 * @param {URL | string} _source - The source URL from which to read the font metrics.
 * @returns {Promise<FontFaceMetrics | null>} - A promise that resolves to the filtered font metrics or null if the source cannot be processed.
 * @async
 */
export async function readMetrics(_source: URL | string): Promise<FontFaceMetrics | null> {
  const source = typeof _source !== 'string' && 'href' in _source ? _source.href : _source

  if (source in metricCache)
    return metricCache[source] ?? null

  // A Windows drive letter is a valid URL scheme, so reject paths before parsing.
  const url = typeof _source === 'string' ? (isAbsolute(_source) ? null : URL.parse(_source)) : _source
  if (!url)
    return null

  let metrics: Font
  if (url.protocol === 'file:') {
    metrics = await fromFile(fileURLToPath(source))
  }
  else {
    if (urlRequestCache.has(source)) {
      metrics = await urlRequestCache.get(source)!
    }
    else {
      const requestPromise = fromUrl(source)
      urlRequestCache.set(source, requestPromise)

      metrics = await requestPromise
    }
  }

  const filteredMetrics = filterRequiredMetrics(metrics)
  metricCache[source] = filteredMetrics
  return filteredMetrics
}

/**
 * Reads font metrics for a `src` URL declared in a stylesheet.
 *
 * A scheme-less, non-rooted URL is resolved against the stylesheet first, then handed to
 * `resolvePath` if that yields no metrics: bare package specifiers and webpack's `~` prefix
 * look identical to stylesheet-relative paths, and only the caller's resolver can map them.
 *
 * `resolvePath` returns a location rather than a URL, so an absolute path it returns is a file
 * on disk. Without a resolver `source` is still the URL the stylesheet declared, where a leading
 * slash means the document root.
 */
export async function readMetricsForSource(source: string, importer: string | undefined, resolvePath?: (path: string) => string | URL): Promise<FontFaceMetrics | null> {
  if (importer && isAbsolute(importer) && isStylesheetRelative(source)) {
    const metrics = await readMetrics(new URL(source, pathToFileURL(importer))).catch(() => null)
    if (metrics)
      return metrics
  }

  if (!resolvePath)
    return readMetrics(source)

  const resolved = resolvePath(source)
  return readMetrics(typeof resolved === 'string' && isAbsolute(resolved) ? pathToFileURL(resolved) : resolved)
}

// inline `@capsizecss/metrics`
// https://github.com/seek-oss/capsize/blob/66344699ff7759a661a78d0629375714c6f308b0/packages/metrics/src/index.ts
function fontFamilyToCamelCase(str: string) {
  return str
    .split(/[\s|-]/)
    .filter(Boolean)
    .map(
      (s, i) =>
        `${s.charAt(0)[i > 0 ? 'toUpperCase' : 'toLowerCase']()}${s.slice(1)}`,
    )
    .join('')
}
