import type { FontFaceData } from 'unifont'
import type { RawFontFaceData } from './types'
import { fileURLToPath } from 'node:url'
import { hash } from 'ohash'
import { extname, relative } from 'pathe'
import { filename } from 'pathe/utils'
import { hasProtocol, joinRelativeURL, joinURL } from 'ufo'
import { formatToExtension, parseFont } from './css/render'

function hashableSource(context: NormalizeFontDataContext, source: { url: string }) {
  if (!source.url.startsWith('file://') || !context.root) {
    return source
  }
  return { ...source, url: relative(context.root, fileURLToPath(source.url)) }
}

function toArray<T>(value?: T | T[]): T[] {
  return !value || Array.isArray(value) ? value as T[] : [value]
}

export interface NormalizeFontDataContext {
  dev: boolean
  renderedFontURLs: Map<string, string>
  assetsBaseURL: string
  /**
   * Project root, used to keep emitted file names for local (`file:`) fonts stable
   * across machines, whose absolute paths differ.
   */
  root?: string
  /**
   * Public URL prefix that `assetsBaseURL` is served under, i.e. Vite's `base`.
   *
   * Only used when the URL is generated here rather than by `resolveAssetURL`, so it must
   * be a path or an absolute URL; a relative base cannot be resolved without knowing the
   * URL of the stylesheet the font is referenced from.
   * @default '/'
   */
  baseURL?: string
  /**
   * Return the URL to embed in generated CSS for a font that will be emitted as `file`.
   *
   * Used during build to hand the font to Vite's asset pipeline (so `base`, a relative
   * base and `experimental.renderBuiltUrl` are all applied to it). Returning `undefined`
   * falls back to joining `baseURL` and `assetsBaseURL` with the file name.
   */
  resolveAssetURL?: (file: string, url: string) => string | undefined
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
            hash(hashableSource(context, source)).replace(/-/, '_') + (extname(source.url) || formatToExtension(source.format) || ''),
          ].filter(Boolean).join('-')

          context.renderedFontURLs.set(file, source.url)
          source.originalURL = source.url

          const baseURL = context.baseURL || '/'
          source.url = context.resolveAssetURL?.(file, source.url)
            ?? (context.dev
              ? joinRelativeURL(baseURL, context.assetsBaseURL, file)
              : joinURL(baseURL, context.assetsBaseURL, file))

          context.callback?.(file, source.url)
        }

        return source
      }),
    })
  }
  return data
}
