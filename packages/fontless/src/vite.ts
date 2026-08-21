import type { Plugin } from 'vite'
import type { NormalizeFontDataContext } from './assets'
import type { FontlessOptions } from './types'
import type { FontFamilyInjectionPluginOptions } from './utils'

import { AsyncLocalStorage } from 'node:async_hooks'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { defu } from 'defu'
import { hasProtocol, joinURL } from 'ufo'
import { normalizeFontData } from './assets'
import { defaultOptions } from './defaults'
import { resolveProviders } from './providers'
import { createResolver } from './resolve'
import { createFontlessStorage } from './storage'
import { transformCSS } from './utils'

// Copied from @tailwindcss-vite
const CSS_LANG_QUERY_RE = /&lang\.css/
const INLINE_STYLE_ID_RE = /[?&]index=\d+\.css$/
// Copied from vue-bundle-renderer utils
const EMPTY_SOURCE = new Uint8Array()

const CSS_EXTENSIONS_RE = /\.(?:css|scss|sass|postcss|pcss|less|stylus|styl)(?:\?[^.]+)?$/

export function fontless(_options?: FontlessOptions): Plugin {
  const options = defu(_options, defaultOptions satisfies FontlessOptions) as FontlessOptions

  let cssTransformOptions: FontFamilyInjectionPluginOptions
  let assetContext: NormalizeFontDataContext
  let storage: ReturnType<typeof createFontlessStorage>

  // `emit` is only available while a CSS module is being transformed, as it needs that
  // transform's plugin context to emit into the right environment's bundle.
  const buildContext = new AsyncLocalStorage<{ emit: (file: string) => string }>()

  // Output file names of emitted fonts, mapped back to their key in `renderedFontURLs`
  const fontFiles = new Map<string, string>()
  function fontFileName(file: string) {
    const fileName = joinURL(assetContext.assetsBaseURL, file).slice(1)
    fontFiles.set(fileName, file)
    return fileName
  }

  async function loadFont(file: string, url: string): Promise<Buffer> {
    const key = `data:fonts:${file}`
    // Use storage to cache the font data between builds
    const cached = await storage.getItemRaw<Buffer>(key)
    if (cached) {
      return cached
    }
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Could not fetch font from \`${url}\` (${response.status} ${response.statusText}).`)
    }
    const res = Buffer.from(await response.arrayBuffer())
    await storage.setItemRaw(key, res)
    return res
  }

  return {
    name: 'vite-plugin-fontless',
    apply: (_config, env) => !env.isPreview,
    async configResolved(config) {
      storage = createFontlessStorage(_options?.cache, { root: config.root, cacheDir: config.cacheDir })

      assetContext = {
        dev: config.mode === 'development',
        renderedFontURLs: new Map<string, string>(),
        assetsBaseURL: options.assets?.prefix || joinURL('/', config.build.assetsDir, '_fonts'),
        // A relative base (`''` or `'./'`) cannot be resolved from a URL in CSS served
        // during dev, where every stylesheet is requested from its own path, so fall back
        // to the server root. During build the URL is resolved by Vite instead (see
        // `resolveAssetURL` below), which handles relative bases correctly.
        baseURL: config.base.startsWith('/') || hasProtocol(config.base) ? config.base : '/',
        // During build, hand fonts to Vite's asset pipeline rather than writing literal
        // URLs, so `base`, a relative base and `experimental.renderBuiltUrl` all apply.
        resolveAssetURL: config.command === 'build'
          ? file => buildContext.getStore()?.emit(file)
          : undefined,
      }

      const alias = Array.isArray(config.resolve.alias) ? {} : config.resolve.alias
      const providers = await resolveProviders(options.providers, { root: config.root, alias })

      // Auto-inject readFile and root for the npm provider
      options.npm = defu(options.npm, {
        readFile: (path: string) => readFile(path, 'utf-8').catch(() => null),
        root: config.root,
      })

      const resolveFontFaceWithOverride = await createResolver({
        options,
        providers,
        storage,
        normalizeFontData: normalizeFontData.bind({}, assetContext),
      })

      cssTransformOptions = {
        processCSSVariables: options.processCSSVariables,
        shouldPreload: () => false,
        filterFontsToPreload(fontFamily, fonts) {
          const override = options.families?.find(f => f.name === fontFamily)
          const preload = override?.preload ?? options.defaults?.preload
          // pick by priority (old behavior)
          if (preload === true) {
            return fonts.sort((a, b) => (a.meta?.priority || 0) - (b.meta?.priority || 0)).slice(0, 1)
          }
          // filter by function
          if (typeof preload === 'function') {
            return fonts.filter(f => preload(fontFamily, f))
          }
          // filter by subset
          if (preload && 'subsets' in preload) {
            return fonts.filter(f => f.meta?.subset && preload.subsets.includes(f.meta.subset))
          }
          return []
        },
        fontsToPreload: new Map(),
        dev: config.mode === 'development',
        async resolveFontFace(fontFamily, fallbackOptions) {
          const override = options.families?.find(f => f.name === fontFamily)

          // This CSS will be injected in a separate location
          if (override?.global) {
            return
          }

          return resolveFontFaceWithOverride(fontFamily, override, fallbackOptions)
        },
      }

      if (!cssTransformOptions.dev && config.css.lightningcss) {
        cssTransformOptions.lightningcssOptions = config.css.lightningcss as FontFamilyInjectionPluginOptions['lightningcssOptions']
      }
    },
    configureServer(server) {
      // serve font assets via middleware during dev
      // based on https://github.com/nuxt/fonts/blob/e7f537a0357896d34be9c17031b3178fb4e79042/src/assets.ts#L30
      // Connect middlewares see the full request path, including `base`
      const mountPath = joinURL(assetContext.baseURL || '/', assetContext.assetsBaseURL)
      server.middlewares.use(mountPath, async (req, res, next) => {
        try {
          const filename = req.url!.slice(1)
          const url = assetContext.renderedFontURLs.get(filename)
          if (!url) {
            next()
            return
          }
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          res.end(await loadFont(filename, url))
        }
        catch (e) {
          next(e)
        }
      })
    },
    transform: {
      filter: {
        id: {
          include: [CSS_EXTENSIONS_RE, CSS_LANG_QUERY_RE, INLINE_STYLE_ID_RE],
        },
        code: {
          // Early return if no font-family is used in this CSS
          exclude: !options.processCSSVariables ? [/^(?!.*font-family\s*:).*$/s] : undefined,
        },
      },
      async handler(code, id) {
        // Font data is downloaded in `generateBundle`; rolldown requires a source up front
        // and has no `setAssetSource`, so emit a placeholder and fill it in there
        const emit = (file: string) => `__VITE_ASSET__${this.emitFile({
          type: 'asset',
          fileName: fontFileName(file),
          source: EMPTY_SOURCE,
        })}__`

        const s = await buildContext.run({ emit }, () => transformCSS(cssTransformOptions, code, id))

        if (s.hasChanged()) {
          return {
            code: s.toString(),
            map: s.generateMap({ hires: true }),
          }
        }
      },
    },
    async generateBundle(_options, bundle) {
      await Promise.all(Object.values(bundle).map(async (output) => {
        if (output.type !== 'asset') {
          return
        }
        const file = fontFiles.get(output.fileName)
        const url = file && assetContext.renderedFontURLs.get(file)
        if (url) {
          output.source = await loadFont(file, url)
        }
      }))
    },
    transformIndexHtml: {
      handler() {
        // Preload doesn't work on initial rendering during dev since `fontsToPreload`
        // is empty before css is transformed.
        const hrefs = [...cssTransformOptions.fontsToPreload.values()].flatMap(v => [...v])
        return hrefs.map(href => ({
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'font',
            href,
            crossorigin: '',
          },
        }))
      },
    },
  }
}
