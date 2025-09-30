import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import type { NormalizeFontDataContext } from './assets'
import type { LinkAttributes } from './runtime'
import type { FontlessOptions } from './types'

import type { FontFamilyInjectionPluginOptions } from './utils'
import { Buffer } from 'node:buffer'
import { defu } from 'defu'
import MagicString from 'magic-string'
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

export function fontless(_options?: FontlessOptions): Plugin[] {
  const options = defu(_options, defaultOptions satisfies FontlessOptions) as FontlessOptions

  let cssTransformOptions: FontFamilyInjectionPluginOptions
  let assetContext: NormalizeFontDataContext
  let resolvedConfig: ResolvedConfig
  let server: ViteDevServer | undefined
  const RUNTIME_NAME = 'fontless/runtime'

  function getPreloads(): LinkAttributes[] {
    const hrefs = [...cssTransformOptions.fontsToPreload.values()].flatMap(v => [...v])
    return hrefs.map(href => ({
      rel: 'preload',
      as: 'font',
      href,
      crossorigin: '',
    }))
  }

  const mainPlugin: Plugin = {
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
    configureServer(server_) {
      // serve font assets via middleware during dev
      // based on https://github.com/nuxt/fonts/blob/e7f537a0357896d34be9c17031b3178fb4e79042/src/assets.ts#L30
      server = server_
      server.middlewares.use(assetContext.assetsBaseURL, async (req, res, next) => {
        try {
          const filename = req.url!.slice(1)
          const url = assetContext.renderedFontURLs.get(filename)
          if (!url) {
            next()
            return
          }
          const key = `data:fonts:${filename}`
          let data = await storage.getItemRaw<Buffer>(key)
          if (!data) {
            data = await fetch(url).then(r => r.arrayBuffer()).then(r => Buffer.from(r))
            await storage.setItemRaw(key, data)
          }
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          res.end(data)
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
        const s = await transformCSS(cssTransformOptions, code, id)

        if (s.hasChanged()) {
          // invalidate virtual module to ensure fresh preloads list during dev
          if (server) {
            invalidateModuleByid(server, `\0${RUNTIME_NAME}`)
          }
          return {
            code: s.toString(),
            map: s.generateMap({ hires: true }),
          }
        }
      },
    },
    async generateBundle() {
      for (const [filename, url] of assetContext.renderedFontURLs) {
        const key = `data:fonts:${filename}`
        // Use storage to cache the font data between builds
        let res = await storage.getItemRaw(key)
        if (!res) {
          res = await fetch(url)
            .then(r => r.arrayBuffer())
            .then(r => Buffer.from(r))

          await storage.setItemRaw(key, res)
        }
        this.emitFile({
          type: 'asset',
          fileName: joinURL(assetContext.assetsBaseURL, filename).slice(1),
          source: res,
        })
      }
    },
    transformIndexHtml: {
      handler() {
        // Preload doesn't work on initial rendering during dev since `fontsToPreload`
        // is empty before css is transformed.
        return getPreloads().map(attrs => ({
          tag: 'link',
          attrs: attrs as unknown as Record<string, string>,
        }))
      },
    },
  }

  const RUNTIME_PLACEHOLDER = '__FONTLESS_RUNTIME_BUILD_PLACEHOLDER__'
  const runtimePlugin: Plugin = {
    name: 'fontless-runtime',
    config() {
      return {
        ssr: {
          // ensure 'fontless/runtime' is loaded through vite
          noExternal: ['fontless'],
        },
      }
    },
    configEnvironment() {
      return {
        resolve: {
          noExternal: ['fontless'],
        },
      }
    },
    resolveId: {
      // override Vite's node resolution
      order: 'pre',
      handler(source) {
        if (source === RUNTIME_NAME) {
          return `\0${RUNTIME_NAME}`
        }
      },
    },
    load: {
      handler(id) {
        if (id === `\0${RUNTIME_NAME}`) {
          // during build, postpone replacement until `renderChunk`
          // to ensure fonts are collected through css transform
          if (resolvedConfig.command === 'build') {
            return `export const { preloads } = ${RUNTIME_PLACEHOLDER}`
          }
          return `export const { preloads } = ${JSON.stringify({ preloads: getPreloads() })}`
        }
      },
    },
    renderChunk(code, _chunk) {
      if (code.includes(RUNTIME_PLACEHOLDER)) {
        const s = new MagicString(code)
        s.replaceAll(
          RUNTIME_PLACEHOLDER,
          JSON.stringify({ preloads: getPreloads() }),
        )
        return {
          code: s.toString(),
          map: s.generateMap({ hires: 'boundary' }),
        }
      }
    },
  }

  return [
    mainPlugin,
    runtimePlugin,
  ]
}

function invalidateModuleByid(server: ViteDevServer, id: string) {
  for (const environment of Object.values(server.environments)) {
    const mod = environment.moduleGraph.getModuleById(id)
    if (mod) {
      environment.moduleGraph.invalidateModule(mod)
    }
  }
}
