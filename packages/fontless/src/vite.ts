import type { FontFaceData, RemoteFontSource } from 'unifont'
import type { Plugin, Rollup, ViteDevServer } from 'vite'
import type { NormalizeFontDataContext, RenderedFont } from './assets'
import type { LinkAttributes } from './runtime'
import type { FontlessOptions } from './types'
import type { FontFamilyInjectionPluginOptions } from './utils'

import { AsyncLocalStorage } from 'node:async_hooks'
import { Buffer } from 'node:buffer'
import { access, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { defu } from 'defu'
import { resolveModulePath } from 'exsolve'
import MagicString from 'magic-string'
import { join } from 'pathe'
import { hasProtocol, joinURL } from 'ufo'
import { normalizeFontData } from './assets'
import { generateFontFace } from './css/render'
import { defaultOptions } from './defaults'
import { resolveProviders } from './providers'
import { createResolver } from './resolve'
import { createFontlessStorage } from './storage'
import { subsetFontData } from './subset'
import { renderDeclaration, transformCSS } from './utils'

// Copied from @tailwindcss-vite
const CSS_LANG_QUERY_RE = /&lang\.css/
const INLINE_STYLE_ID_RE = /[?&]index=\d+\.css$/
// Copied from vue-bundle-renderer utils
const EMPTY_SOURCE = new Uint8Array()

// Fonts declared `global` have no stylesheet of their own, so their declarations are
// keyed by this synthetic id in `fontsToPreload` and in minification diagnostics.
const GLOBAL_CSS_ID = '\0fontless:global.css'

const CSS_EXTENSIONS_RE = /\.(?:css|scss|sass|postcss|pcss|less|stylus|styl)(?:\?[^.]+)?$/

export function fontless(_options?: FontlessOptions): Plugin[] {
  const options = defu(_options, defaultOptions satisfies FontlessOptions) as FontlessOptions

  let cssTransformOptions: FontFamilyInjectionPluginOptions
  let assetContext: NormalizeFontDataContext & { baseURL: string }
  let command: 'build' | 'serve'
  let server: ViteDevServer | undefined
  const RUNTIME_NAME = 'fontless/runtime'
  let storage: ReturnType<typeof createFontlessStorage>

  // `emit` is only available while a CSS module is being transformed, as it needs that
  // transform's plugin context to emit into the right environment's bundle. `collect`
  // gathers the fonts referenced by declarations generated outside any CSS module, which
  // therefore have to be emitted from `generateBundle` instead.
  const buildContext = new AsyncLocalStorage<{ emit?: (file: string) => string, collect?: Set<string> }>()

  // Output file names of emitted fonts, mapped back to their key in `renderedFontURLs`
  const fontFiles = new Map<string, string>()
  function fontFileName(file: string) {
    const fileName = joinURL(assetContext.assetsBaseURL, file).slice(1)
    fontFiles.set(fileName, file)
    return fileName
  }

  // Asset reference ids of emitted fonts, keyed by environment: a font emitted for one
  // environment cannot be referenced from another, and emitting the same file name twice
  // within one environment is an error.
  const fontRefs = new Map<string, string>()
  function emitFont(ctx: Rollup.PluginContext, file: string, source: Uint8Array | Buffer) {
    const key = `${ctx.environment.name}:${file}`
    let ref = fontRefs.get(key)
    if (!ref) {
      ref = ctx.emitFile({ type: 'asset', fileName: fontFileName(file), source })!
      fontRefs.set(key, ref)
    }
    return `__VITE_ASSET__${ref}__`
  }

  async function loadFont(file: string, { url, init, subset }: RenderedFont): Promise<Buffer> {
    if (url.startsWith('file://')) {
      const font = await readFile(fileURLToPath(url))
      return subset ? subsetFontData(font, subset, url) : font
    }

    // The file name is hashed from the glyph list as well as the URL, so cached bytes are
    // never a stale subset of a font whose glyph list has since changed.
    const key = `data:fonts:${file}`
    // Use storage to cache the font data between builds
    const cached = await storage.getItemRaw<Buffer>(key)
    if (cached) {
      return cached
    }
    const response = await fetch(url, init)
    if (!response.ok) {
      throw new Error(`Could not fetch font from \`${url}\` (${response.status} ${response.statusText}).`)
    }
    const downloaded = Buffer.from(await response.arrayBuffer())
    const res = subset ? await subsetFontData(downloaded, subset, url) : downloaded
    await storage.setItemRaw(key, res)
    return res
  }

  // URLs of emitted fonts as the browser will request them, keyed by the URL that was
  // written into the generated CSS. During build the latter is a per-environment asset
  // placeholder, which cannot be rendered into a server bundle: the placeholder's
  // reference id belongs to whichever environment emitted the font.
  const publicFontURLs = new Map<string, string>()

  function publicFontURL(file: string) {
    return joinURL(assetContext.baseURL, assetContext.assetsBaseURL, file)
  }

  function selectFontsToPreload(fontFamily: string, fonts: FontFaceData[]): FontFaceData[] {
    const override = options.families?.find(f => f.name === fontFamily)
    const preload = override?.preload ?? options.defaults?.preload
    if (preload === true) {
      return [...fonts].sort((a, b) => (a.meta?.priority || 0) - (b.meta?.priority || 0)).slice(0, 1)
    }
    if (typeof preload === 'function') {
      return fonts.filter(f => preload(fontFamily, f))
    }
    if (preload && 'subsets' in preload) {
      return fonts.filter(f => f.meta?.subset && preload.subsets.includes(f.meta.subset))
    }
    return []
  }

  function getPreloadHrefs() {
    return [...cssTransformOptions.fontsToPreload.values()].flatMap(v => [...v])
  }

  // Fonts referenced only by the global stylesheet, which is not attached to any module
  const globalFontFiles = new Set<string>()
  let resolveFontFaceWithOverride: Awaited<ReturnType<typeof createResolver>>
  let globalFontFaces: Promise<string> | undefined

  /**
   * Render the `@font-face` blocks for families declared `global`, which by definition
   * have no usage site in CSS to discover them from, and register their preloads.
   *
   * Fallback metric faces are not included: they are emitted per stylesheet alongside the
   * usage sites they apply to, via `fallbacksOnly`.
   */
  function getGlobalFontFaces(): Promise<string> {
    globalFontFaces ??= (async () => {
      const families = options.families?.filter(f => f.global) ?? []
      const declarations: string[] = []
      const hrefs = new Set<string>()

      for (const family of families) {
        const result = await buildContext.run(
          { collect: globalFontFiles },
          () => resolveFontFaceWithOverride(family.name, family),
        )
        if (!result?.fonts?.length) {
          continue
        }

        const fonts = [...result.fonts].sort((a, b) => (a.meta?.priority || 0) - (b.meta?.priority || 0))
        for (const font of selectFontsToPreload(family.name, fonts)) {
          const url = font.src.find((s): s is RemoteFontSource => 'url' in s)?.url
          if (url) {
            hrefs.add(url)
          }
        }

        // reverse order by priority since last rule with overlapping unicode-range wins
        // https://www.w3.org/TR/css-fonts-4/#composite-fonts
        for (const font of fonts.reverse()) {
          declarations.push(renderDeclaration(generateFontFace(family.name, font), GLOBAL_CSS_ID, cssTransformOptions))
        }
      }

      if (hrefs.size > 0) {
        cssTransformOptions.fontsToPreload.set(GLOBAL_CSS_ID, hrefs)
      }

      return declarations.join('')
    })()

    return globalFontFaces
  }

  // Public URL of each global font, mapped to the asset placeholder standing in for it in
  // the HTML. Empty outside a client build, where there is no HTML to write.
  let globalAssetURLs: Array<[string, string]> = []

  /**
   * Emit the fonts referenced only by global `@font-face` declarations, and record the
   * placeholder standing in for each one, so that `base`, a relative base and
   * `experimental.renderBuiltUrl` are applied to the URLs written into the HTML.
   *
   * Global fonts are not reachable from any module, so they are resolved without a plugin
   * context and only gain a reference id here.
   */
  async function emitGlobalFonts(ctx: Rollup.PluginContext) {
    await getGlobalFontFaces()

    return Promise.all([...globalFontFiles].map(async (file): Promise<[string, string]> => {
      const font = assetContext.renderedFontURLs.get(file)!
      return [publicFontURL(file), emitFont(ctx, file, await loadFont(file, font))]
    }))
  }

  function withEmittedAssets(value: string) {
    return globalAssetURLs.reduce((value, [from, to]) => value.replaceAll(from, to), value)
  }

  function toPreloadLinks(hrefs: string[]): LinkAttributes[] {
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
      command = config.command
      storage = createFontlessStorage(_options?.cache, { root: config.root, cacheDir: config.cacheDir })

      assetContext = {
        dev: config.mode === 'development',
        renderedFontURLs: new Map<string, RenderedFont>(),
        root: config.root,
        assetsBaseURL: options.assets?.prefix || joinURL('/', config.build.assetsDir, '_fonts'),
        // A relative base (`''` or `'./'`) cannot be resolved from a URL in CSS served
        // during dev, where every stylesheet is requested from its own path, so fall back
        // to the server root. During build the URL is resolved by Vite instead (see
        // `resolveAssetURL` below), which handles relative bases correctly.
        baseURL: config.base.startsWith('/') || hasProtocol(config.base) ? config.base : '/',
        // During build, hand fonts to Vite's asset pipeline rather than writing literal
        // URLs, so `base`, a relative base and `experimental.renderBuiltUrl` all apply.
        resolveAssetURL: config.command === 'build'
          ? file => buildContext.getStore()?.emit?.(file)
          : undefined,
        callback: (file, url) => {
          publicFontURLs.set(url, joinURL(assetContext.baseURL, assetContext.assetsBaseURL, file))
          buildContext.getStore()?.collect?.add(file)
        },
      }

      // A resolved config always normalises `resolve.alias` to an array, which jiti cannot
      // consume; the object form is only reachable via a hand-built config object.
      /* v8 ignore next */
      const alias = Array.isArray(config.resolve.alias) ? {} : config.resolve.alias
      const providers = await resolveProviders(options.providers, { root: config.root, alias })

      // Auto-inject readFile, exists, resolve and root for the npm provider
      options.npm = defu(options.npm, {
        readFile: (path: string) => readFile(path, 'utf-8').catch(() => null),
        exists: (path: string) => access(path).then(() => true, () => false),
        // Font packages are not always linked into `<root>/node_modules`: pnpm's isolated
        // store and hoisting to a monorepo root both put them elsewhere. `style` is
        // included for packages that expose their stylesheet only under that condition,
        // and the fallback covers packages whose `exports` omit CSS entirely.
        resolve: (id: string) => resolveModulePath(id, {
          from: `${config.root}/`,
          conditions: ['node', 'import', 'style', 'default'],
          try: true,
        }) ?? join(config.root, 'node_modules', id),
        root: config.root,
      })

      resolveFontFaceWithOverride = await createResolver({
        options,
        providers,
        storage,
        normalizeFontData: normalizeFontData.bind({}, assetContext),
      })

      cssTransformOptions = {
        processCSSVariables: options.processCSSVariables,
        selectFontsToPreload,
        fontsToPreload: new Map(),
        dev: config.mode === 'development',
        async resolveFontFace(fontFamily, fallbackOptions) {
          const override = options.families?.find(f => f.name === fontFamily)
          const result = await resolveFontFaceWithOverride(fontFamily, override, fallbackOptions)

          // The primary `@font-face` is emitted once into the global stylesheet, but usage
          // sites in this file still need their fallback metric faces
          if (result && override?.global) {
            return { ...result, fallbacksOnly: true }
          }

          return result
        },
      }

      if (!cssTransformOptions.dev && config.css.lightningcss) {
        cssTransformOptions.lightningcssOptions = config.css.lightningcss as FontFamilyInjectionPluginOptions['lightningcssOptions']
      }
    },
    async buildStart() {
      // Only the client build writes HTML, and the placeholders are reference ids scoped to
      // the environment that emitted them
      if (command === 'build' && this.environment.config.consumer === 'client') {
        globalAssetURLs = await emitGlobalFonts(this)
      }
    },
    configureServer(server_) {
      // serve font assets via middleware during dev
      // based on https://github.com/nuxt/fonts/blob/e7f537a0357896d34be9c17031b3178fb4e79042/src/assets.ts#L30
      server = server_
      // Connect middlewares see the full request path, including `base`
      const mountPath = joinURL(assetContext.baseURL, assetContext.assetsBaseURL)
      server.middlewares.use(mountPath, async (req, res, next) => {
        try {
          const filename = req.url!.slice(1)
          const font = assetContext.renderedFontURLs.get(filename)
          if (!font) {
            next()
            return
          }
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          res.end(await loadFont(filename, font))
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
          // invalidate virtual module to ensure fresh preloads list during dev
          if (server) {
            invalidateModuleById(server, `\0${RUNTIME_NAME}`)
          }
          return {
            code: s.toString(),
            map: s.generateMap({ hires: true }),
          }
        }
      },
    },
    async generateBundle(_options, bundle) {
      // Global fonts are reachable from no module, so nothing else will have emitted them
      // for this environment
      await emitGlobalFonts(this)

      await Promise.all(Object.values(bundle).map(async (output) => {
        if (output.type !== 'asset') {
          return
        }
        const file = fontFiles.get(output.fileName)
        const font = file && assetContext.renderedFontURLs.get(file)
        if (font) {
          output.source = await loadFont(file, font)
        }
      }))
    },
    transformIndexHtml: {
      async handler() {
        // Inline rather than linking a stylesheet: a blocking request would delay the
        // point at which the browser knows the family exists, which is the only reason
        // these declarations are hoisted out of CSS in the first place.
        //
        // Preload doesn't work on initial rendering during dev since `fontsToPreload`
        // is empty before css is transformed. Global fonts are unaffected, as they are
        // resolved here rather than discovered.
        const css = withEmittedAssets(await getGlobalFontFaces())

        const tags = toPreloadLinks(getPreloadHrefs().map(withEmittedAssets)).map(attrs => ({
          tag: 'link',
          attrs: attrs as unknown as Record<string, string>,
        }))

        if (css) {
          tags.push({ tag: 'style', attrs: { type: 'text/css' }, children: css } as never)
        }

        return tags
      },
    },
  }

  function getRuntimePreloads(): LinkAttributes[] {
    return toPreloadLinks(getPreloadHrefs().map(href => publicFontURLs.get(href) ?? href))
  }

  async function getRuntimeExports() {
    // `@font-face` blocks must be resolved before preloads are read, as global families
    // register their preloads as a side effect
    const globalFontFaces = await getGlobalFontFaces()
    return { preloads: getRuntimePreloads(), globalFontFaces }
  }

  const RUNTIME_PLACEHOLDER = '__FONTLESS_RUNTIME_BUILD_PLACEHOLDER__'
  let warnedAboutEmptyPreloads = false
  const runtimePlugin: Plugin = {
    name: 'fontless-runtime',
    configEnvironment() {
      return {
        resolve: {
          // an externalised import would bypass `resolveId` below and load the
          // published stub, which has no preloads or font faces in it
          noExternal: [RUNTIME_NAME],
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
      async handler(id) {
        if (id === `\0${RUNTIME_NAME}`) {
          // during build, postpone replacement until `renderChunk`
          // to ensure fonts are collected through css transform
          if (command === 'build') {
            return `export const { preloads, globalFontFaces } = ${RUNTIME_PLACEHOLDER}`
          }
          return `export const { preloads, globalFontFaces } = ${JSON.stringify(await getRuntimeExports())}`
        }
      },
    },
    renderChunk: {
      order: 'pre',
      async handler(code) {
        if (code.includes(RUNTIME_PLACEHOLDER)) {
          const exports = await getRuntimeExports()
          const { preloads } = exports
          if (preloads.length === 0 && !warnedAboutEmptyPreloads) {
            warnedAboutEmptyPreloads = true
            this.warn('`fontless/runtime` was imported but no fonts are marked for preloading, so `preloads` will be empty. Enable `defaults.preload` or set `preload` on individual `families` entries.')
          }
          const s = new MagicString(code)
          s.replaceAll(RUNTIME_PLACEHOLDER, JSON.stringify(exports))
          return {
            code: s.toString(),
            map: s.generateMap({ hires: 'boundary' }),
          }
        }
      },
    },
  }

  return [
    mainPlugin,
    runtimePlugin,
  ]
}

function invalidateModuleById(server: ViteDevServer, id: string) {
  for (const environment of Object.values(server.environments)) {
    const mod = environment.moduleGraph.getModuleById(id)
    if (mod) {
      environment.moduleGraph.invalidateModule(mod)
    }
  }
}
