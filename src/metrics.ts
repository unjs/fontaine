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
