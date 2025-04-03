import type { Font } from '@capsizecss/unpack'
import type { FontFaceMetrics } from './css'

import { fileURLToPath } from 'node:url'
import { fontFamilyToCamelCase } from '@capsizecss/metrics'
import { fromFile, fromUrl } from '@capsizecss/unpack'
import { parseURL } from 'ufo'

import { withoutQuotes } from './css'

const metricCache: Record<string, FontFaceMetrics | null> = {}

function filterRequiredMetrics({ ascent, descent, lineGap, unitsPerEm, xWidthAvg }: Pick<Font, 'ascent' | 'descent' | 'lineGap' | 'unitsPerEm' | 'xWidthAvg'>) {
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
    const { entireMetricsCollection } = await import('@capsizecss/metrics/entireMetricsCollection')
    const metrics = entireMetricsCollection[name as keyof typeof entireMetricsCollection]

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
 * Reads font metrics from a specified source URL or file path. This function supports both local files and remote URLs.
 * It caches the results to optimise subsequent requests for the same source.
 * @param {URL | string} _source - The source URL or local file path from which to read the font metrics.
 * @returns {Promise<FontFaceMetrics | null>} - A promise that resolves to the filtered font metrics or null if the source cannot be processed.
 * @async
 */
export async function readMetrics(_source: URL | string) {
  const source = typeof _source !== 'string' && 'href' in _source ? _source.href : _source

  if (source in metricCache)
    return Promise.resolve(metricCache[source])

  const { protocol } = parseURL(source)
  if (!protocol)
    return null

  let metrics: Font
  if (protocol === 'file:') {
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
