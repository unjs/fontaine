import type { RemoteFontSource } from 'unifont'
import type { FontSource, NormalizedFontFaceData } from '../types'
import { generateFontFace as generateFallbackFontFace, getMetricsForFamily, readMetrics } from 'fontaine'
import { extname, relative } from 'pathe'
import { hasProtocol } from 'ufo'

export function generateFontFace(family: string, font: NormalizedFontFaceData): string {
  return [
    '@font-face {',
    `  font-family: '${family}';`,
    `  src: ${renderFontSrc(font.src)};`,
    `  font-display: ${font.display || 'swap'};`,
    font.unicodeRange && `  unicode-range: ${font.unicodeRange};`,
    font.weight && `  font-weight: ${Array.isArray(font.weight) ? font.weight.join(' ') : font.weight};`,
    font.style && `  font-style: ${font.style};`,
    font.stretch && `  font-stretch: ${font.stretch};`,
    font.featureSettings && `  font-feature-settings: ${font.featureSettings};`,
    font.variationSettings && `  font-variation-settings: ${font.variationSettings};`,
    font.ascentOverride && `  ascent-override: ${font.ascentOverride};`,
    font.descentOverride && `  descent-override: ${font.descentOverride};`,
    font.lineGapOverride && `  line-gap-override: ${font.lineGapOverride};`,
    font.sizeAdjust && `  size-adjust: ${font.sizeAdjust};`,
    `}`,
  ].filter(Boolean).join('\n')
}

/** Metrics a provider may report for a face. Only `unitsPerEm` is guaranteed to be present. */
interface ProviderFontMetrics {
  unitsPerEm: number
  ascent?: number
  descent?: number
  lineGap?: number
  capHeight?: number
  xHeight?: number
  xWidthAvg?: number
}

type FallbackMetrics = Pick<Required<ProviderFontMetrics>, 'ascent' | 'descent' | 'lineGap' | 'unitsPerEm' | 'xWidthAvg'>

const OPTIONAL_METRICS = ['ascent', 'descent', 'lineGap', 'capHeight', 'xHeight', 'xWidthAvg'] as const

/**
 * Metrics reported by the provider that resolved this face, if any. Not every version of
 * `unifont` returns them, so the shape is validated before use.
 */
function readProviderMetrics(data: NormalizedFontFaceData): ProviderFontMetrics | undefined {
  const candidate = (data as { metrics?: unknown }).metrics
  if (!candidate || typeof candidate !== 'object') {
    return
  }
  const metrics = candidate as Record<string, unknown>
  if (typeof metrics.unitsPerEm !== 'number' || !metrics.unitsPerEm) {
    return
  }
  const result: ProviderFontMetrics = { unitsPerEm: metrics.unitsPerEm }
  for (const key of OPTIONAL_METRICS) {
    if (typeof metrics[key] === 'number') {
      result[key] = metrics[key]
    }
  }
  return result
}

/**
 * Complete a provider's metrics into the set the fallback faces are derived from, filling gaps
 * from the metrics database where the family is known there.
 *
 * `ascent`, `descent` and `lineGap` are all needed, since each is divided by the em square to
 * produce one of the `*-override` descriptors. `xWidthAvg` only drives `size-adjust`, and zero
 * leaves the fallback at its natural width. Database values are in that font's own em square, so
 * they are scaled into the provider's before being mixed in.
 */
function resolveProviderMetrics(data: NormalizedFontFaceData, knownMetrics: FallbackMetrics | null): FallbackMetrics | undefined {
  const metrics = readProviderMetrics(data)
  if (!metrics) {
    return
  }
  const scale = knownMetrics ? metrics.unitsPerEm / knownMetrics.unitsPerEm : 0
  const fill = (key: keyof FallbackMetrics) => knownMetrics ? knownMetrics[key] * scale : undefined

  const ascent = metrics.ascent ?? fill('ascent')
  const descent = metrics.descent ?? fill('descent')
  const lineGap = metrics.lineGap ?? fill('lineGap')
  if (ascent === undefined || descent === undefined || lineGap === undefined) {
    return
  }
  return {
    ascent,
    descent,
    lineGap,
    unitsPerEm: metrics.unitsPerEm,
    xWidthAvg: metrics.xWidthAvg ?? fill('xWidthAvg') ?? 0,
  }
}

export async function generateFontFallbacks(family: string, data: NormalizedFontFaceData, fallbacks?: Array<{ name: string, font: string }>): Promise<string[]> {
  if (!fallbacks?.length)
    return []

  const fontURL = data.src!.find(s => 'url' in s) as RemoteFontSource | undefined
  const knownMetrics = await getMetricsForFamily(family)
  const metrics = resolveProviderMetrics(data, knownMetrics) || knownMetrics || (fontURL && await readMetrics(fontURL.originalURL || fontURL.url))

  if (!metrics)
    return []

  const css: string[] = []
  for (const fallback of fallbacks) {
    css.push(generateFallbackFontFace(metrics, {
      ...fallback,
      metrics: await getMetricsForFamily(fallback.font) || undefined,
    }))
  }
  return css
}

const formatMap: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  otf: 'opentype',
  ttf: 'truetype',
  eot: 'embedded-opentype',
  svg: 'svg',
}
const extensionMap = Object.fromEntries(Object.entries(formatMap).map(([key, value]) => [value, key]))
export const formatToExtension = (format?: string): string | undefined => format && format in extensionMap ? `.${extensionMap[format]}` : undefined

export function parseFont(font: string): RemoteFontSource | { name: string } {
  // render as `url("url/to/font") format("woff2")`
  if (font.startsWith('/') || hasProtocol(font)) {
    const extension = extname(font).slice(1)
    const format = formatMap[extension]

    return {
      url: font,
      format,
    } satisfies RemoteFontSource as RemoteFontSource
  }

  // render as `local("Font Name")`
  return { name: font }
}

// https://drafts.csswg.org/css-fonts-4/#font-format-values
const fontFormatKeywords = new Set(['collection', 'embedded-opentype', 'opentype', 'svg', 'truetype', 'woff', 'woff2'])

function renderFontSrc(sources: Exclude<FontSource, string>[]) {
  return sources.map((src) => {
    if ('url' in src) {
      let rendered = `url("${src.url}")`
      // `format()` takes a `<font-format>` keyword, or a string for values outside
      // that set (such as the legacy `woff2-variations`).
      if (src.format) {
        rendered += ` format(${fontFormatKeywords.has(src.format) ? src.format : `"${src.format}"`})`
      }
      // `tech()` takes `<font-tech>` keywords only — never a string.
      if (src.tech) {
        rendered += ` tech(${src.tech})`
      }
      return rendered
    }
    return `local("${src.name}")`
  }).join(', ')
}

export function relativiseFontSources(font: NormalizedFontFaceData, relativeTo: string): NormalizedFontFaceData {
  return {
    ...font,
    src: font.src.map((source) => {
      if ('name' in source)
        return source
      if (!source.url.startsWith('/'))
        return source
      return {
        ...source,
        url: relative(relativeTo, source.url),
      }
    }),
  } satisfies NormalizedFontFaceData
}
