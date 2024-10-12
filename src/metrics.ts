import { fileURLToPath } from 'node:url'
import type { Font } from '@capsizecss/unpack'
import { fromFile, fromUrl } from '@capsizecss/unpack'
import { fontFamilyToCamelCase } from '@capsizecss/metrics'
import { parseURL } from 'ufo'
import type { FontFaceMetrics } from './css'
import { withoutQuotes } from './css'

const metricCache: Record<string, FontFaceMetrics | null> = {}

function filterRequiredMetrics({
  ascent,
  descent,
  lineGap,
  unitsPerEm,
  xWidthAvg,
}: Pick<
  Font,
  'ascent' | 'descent' | 'lineGap' | 'unitsPerEm' | 'xWidthAvg'
>) {
  return {
    ascent,
    descent,
    lineGap,
    unitsPerEm,
    xWidthAvg,
  }
}

/**
 * Retrieves the font metrics for a given font family from the metrics collection. Uses caching to avoid redundant calculations.
 * @param {string} family - The name of the font family for which metrics are requested.
 * @returns {Promise<FontFaceMetrics | null>} - A promise that resolves with the filtered font metrics or null if not found. See {@link FontFaceMetrics}.
 * @async
 */
export async function getMetricsForFamily(family: string) {
  family = withoutQuotes(family)

  if (family in metricCache)
    return metricCache[family]

  try {
    const name = fontFamilyToCamelCase(family)
    const { entireMetricsCollection } = await import(
      '@capsizecss/metrics/entireMetricsCollection'
    )
    const metrics
      = entireMetricsCollection[name as keyof typeof entireMetricsCollection]

    const filteredMetrics = filterRequiredMetrics(metrics)
    metricCache[family] = filteredMetrics
    return filteredMetrics
  }
  catch {
    metricCache[family] = null
    return null
  }
}

/**
 * Reads font metrics from a specified source URL or file path. This function supports both local files and remote URLs.
 * It caches the results to optimise subsequent requests for the same source.
 * @param {URL | string} _source - The source URL or local file path from which to read the font metrics.
 * @returns {Promise<FontFaceMetrics | null>} - A promise that resolves to the filtered font metrics or null if the source cannot be processed.
 * @async
 */
export async function readMetrics(_source: URL | string) {
  const source
    = typeof _source !== 'string' && 'href' in _source ? _source.href : _source

  if (source in metricCache)
    return Promise.resolve(metricCache[source])

  const { protocol } = parseURL(source)
  if (!protocol)
    return null

  const metrics
    = protocol === 'file:'
      ? await fromFile(fileURLToPath(source))
      : await fromUrl(source)

  const filteredMetrics = filterRequiredMetrics(metrics)
  metricCache[source] = filteredMetrics

  return filteredMetrics
}
