import { hasProtocol } from 'ufo'
import { extname, relative } from 'pathe'
import { getMetricsForFamily, generateFontFace as generateFallbackFontFace, readMetrics } from 'fontaine'
import type { RemoteFontSource, FontFaceData } from 'unifont'
import type { FontSource } from '../types'

export function generateFontFace(family: string, font: FontFaceData) {
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
    `}`,
  ].filter(Boolean).join('\n')
}

export async function generateFontFallbacks(family: string, data: FontFaceData, fallbacks?: Array<{ name: string, font: string }>) {
  if (!fallbacks?.length) return []

  const fontURL = data.src!.find(s => 'url' in s) as RemoteFontSource | undefined
  const metrics = await getMetricsForFamily(family) || (fontURL && await readMetrics(fontURL.originalURL || fontURL.url))

  if (!metrics) return []

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
export const formatToExtension = (format?: string) => format && format in extensionMap ? '.' + extensionMap[format] : undefined

export function parseFont(font: string) {
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

function renderFontSrc(sources: Exclude<FontSource, string>[]) {
  return sources.map((src) => {
    if ('url' in src) {
      let rendered = `url("${src.url}")`
      for (const key of ['format', 'tech'] as const) {
        if (key in src) {
          rendered += ` ${key}(${src[key]})`
        }
      }
      return rendered
    }
    return `local("${src.name}")`
  }).join(', ')
}

export function relativiseFontSources(font: FontFaceData, relativeTo: string) {
  return {
    ...font,
    src: font.src.map((source) => {
      if ('name' in source) return source
      if (!source.url.startsWith('/')) return source
      return {
        ...source,
        url: relative(relativeTo, source.url),
      }
    }),
  } satisfies FontFaceData
}
