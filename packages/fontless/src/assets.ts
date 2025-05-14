import { hash } from 'ohash'
import { extname } from 'pathe'
import { filename } from 'pathe/utils'
import { hasProtocol, joinRelativeURL, joinURL } from 'ufo'
import type { FontFaceData } from 'unifont'
import type { RawFontFaceData } from './types'
import { formatToExtension, parseFont } from './css/render'

function toArray<T>(value?: T | T[]): T[] {
  return !value || Array.isArray(value) ? value as T[] : [value]
}

export interface NormalizeFontDataContext {
  dev: boolean
  renderedFontURLs: Map<string, string>
  assetsBaseURL: string
  callback?: (filename: string, url: string) => void
}

export function normalizeFontData(context: NormalizeFontDataContext, faces: RawFontFaceData | FontFaceData[]): FontFaceData[] {
  const data: FontFaceData[] = []
  for (const face of toArray(faces)) {
    data.push({
      ...face,
      unicodeRange: toArray(face.unicodeRange),
      src: toArray(face.src).map((src) => {
        const source = typeof src === 'string' ? parseFont(src) : src
        if ('url' in source && hasProtocol(source.url, { acceptRelative: true })) {
          source.url = source.url.replace(/^\/\//, 'https://')
          const _url = source.url.replace(/\?.*/, '')
          const MAX_FILENAME_PREFIX_LENGTH = 50
          const file = [
            // TODO: investigate why negative ignore pattern below is being ignored
            hash(filename(_url) || _url).replace(/^-+/, '').slice(0, MAX_FILENAME_PREFIX_LENGTH),
            hash(source).replace(/-/, '_') + (extname(source.url) || formatToExtension(source.format) || ''),
          ].filter(Boolean).join('-')

          context.renderedFontURLs.set(file, source.url)
          source.originalURL = source.url

          source.url = context.dev
            ? joinRelativeURL(context.assetsBaseURL, file)
            : joinURL(context.assetsBaseURL, file)

          context.callback?.(file, source.url)
        }

        return source
      }),
    })
  }
  return data
}
