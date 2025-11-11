import type { Plugin, ResolvedConfig } from 'vite'
import type { NormalizeFontDataContext } from './assets'
import type { FontlessOptions } from './types'
import type { FontFamilyInjectionPluginOptions } from './utils'

import { Buffer } from 'node:buffer'
import { defu } from 'defu'
import { joinURL } from 'ufo'
import { normalizeFontData } from './assets'
import { defaultOptions } from './defaults'
import { resolveProviders } from './providers'
import { createResolver } from './resolve'
import { storage } from './storage'
import { resolveMinifyCssEsbuildOptions, transformCSS } from './utils'

// Copied from @tailwindcss-vite
const CSS_LANG_QUERY_RE = /&lang\.css/
const INLINE_STYLE_ID_RE = /[?&]index=\d+\.css$/
// Copied from vue-bundle-renderer utils
const CSS_EXTENSIONS_RE = /\.(?:css|scss|sass|postcss|pcss|less|stylus|styl)(?:\?[^.]+)?$/

export function fontless(_options?: FontlessOptions): Plugin {
  const options = defu(_options, defaultOptions satisfies FontlessOptions) as FontlessOptions

  let cssTransformOptions: FontFamilyInjectionPluginOptions
  let assetContext: NormalizeFontDataContext
  let resolvedConfig: ResolvedConfig

  async function getFontDataWithCache(filename: string, url: string) {
    const key = `data:fonts:${filename}`
    let data = await storage.getItemRaw<Buffer>(key)
    if (!data) {
      data = await fetch(url).then(r => r.arrayBuffer()).then(r => Buffer.from(r))
      await storage.setItemRaw(key, data)
    }
    return data!
  }

  return {
    name: 'vite-plugin-fontless',
    apply: (_config, env) => !env.isPreview,
    async configResolved(config) {
      resolvedConfig = config
      assetContext = {
        dev: config.mode === 'development',
        renderedFontURLs: new Map<string, string>(),
        assetsBaseURL: options.assets?.prefix || joinURL('/', config.build.assetsDir, '_fonts'),
      }

      const alias = Array.isArray(config.resolve.alias) ? {} : config.resolve.alias
      const providers = await resolveProviders(options.providers, { root: config.root, alias })

      const resolveFontFaceWithOverride = await createResolver({
        options,
        providers,
        storage,
        normalizeFontData: normalizeFontData.bind({}, assetContext),
      })

      cssTransformOptions = {
        processCSSVariables: options.processCSSVariables,
        shouldPreload(fontFamily, _fontFace) {
          const override = options.families?.find(f => f.name === fontFamily)
          return override?.preload ?? options.defaults?.preload ?? false
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

      if (!cssTransformOptions.dev) {
        if (config.css.lightningcss) {
          cssTransformOptions.lightningcssOptions = config.css.lightningcss
        }
        else if (config.esbuild) {
          cssTransformOptions.esbuildOptions = defu(cssTransformOptions.esbuildOptions, resolveMinifyCssEsbuildOptions(config.esbuild))
        }
      }
    },
    configureServer(server) {
      // serve font assets via middleware during dev
      // based on https://github.com/nuxt/fonts/blob/e7f537a0357896d34be9c17031b3178fb4e79042/src/assets.ts#L30
      server.middlewares.use(assetContext.assetsBaseURL, async (req, res, next) => {
        try {
          const filename = req.url!.slice(1)
          const url = assetContext.renderedFontURLs.get(filename)
          if (!url) {
            next()
            return
          }
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          res.end(await getFontDataWithCache(filename, url))
        }
        catch (e) {
          next(e)
        }
      })
    },
    buildStart() {
      if (resolvedConfig.command === 'build') {
        // during build, emit font assets via callback, which gets triggered during `transformCSS`.
        assetContext.callback = async (filename) => {
          const url = assetContext.renderedFontURLs.get(filename)!
          this.emitFile({
            type: 'asset',
            fileName: joinURL(assetContext.assetsBaseURL, filename).slice(1),
            source: await getFontDataWithCache(filename, url),
          })
        }
      }
    },
    async buildEnd() {
      if (resolvedConfig.command === 'build') {
        delete assetContext.callback
      }
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
        const s = await transformCSS(cssTransformOptions, code, id)

        if (s.hasChanged()) {
          return {
            code: s.toString(),
            map: s.generateMap({ hires: true }),
          }
        }
      },
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
