// temporarily expose as a vite plugin prior to migrating core to `fontaine`

import fsp from 'node:fs/promises'
import type { Plugin } from 'vite'
import { defu } from 'defu'
import { resolve } from 'pathe'

import { joinRelativeURL, joinURL } from 'ufo'
import { defaultOptions } from './defaults'
import type { FontlessOptions } from './types'
import { resolveMinifyCssEsbuildOptions, transformCSS } from './utils'
import type { FontFamilyInjectionPluginOptions } from './utils'
import { createResolver } from './resolve'
import { normalizeFontData } from './assets'
import type { NormalizeFontDataContext } from './assets'
import { storage } from './storage'
import { resolveProviders } from './providers'

export function fontless(_options?: FontlessOptions): Plugin {
  const options = defu(_options, defaultOptions satisfies FontlessOptions) as FontlessOptions

  let cssTransformOptions: FontFamilyInjectionPluginOptions
  let assetContext: NormalizeFontDataContext
  let publicDir: string

  return {
    name: 'vite-plugin-fontless',

    async configResolved(config) {
      assetContext = {
        dev: config.mode === 'development',
        renderedFontURLs: new Map<string, string>(),
        assetsBaseURL: options.assets?.prefix || '/fonts',
      }

      publicDir = resolve(config.root, config.build.outDir, '.' + joinURL(config.base, assetContext.assetsBaseURL))

      const alias = Array.isArray(config.resolve.alias) ? {} : config.resolve.alias
      const providers = await resolveProviders(options.providers, { root: config.root, alias })

      const resolveFontFaceWithOverride = await createResolver({
        options,
        providers,
        normalizeFontData: normalizeFontData.bind({}, assetContext),
      })

      cssTransformOptions = {
        processCSSVariables: false,
        shouldPreload: () => false,
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

      if (!cssTransformOptions.dev && config.esbuild) {
        cssTransformOptions.esbuildOptions = defu(cssTransformOptions.esbuildOptions, resolveMinifyCssEsbuildOptions(config.esbuild))
      }
    },
    async transform(code, id) {
      // Early return if no font-family is used in this CSS
      if (!options.processCSSVariables && !code.includes('font-family:')) {
        return
      }

      const s = await transformCSS(cssTransformOptions, code, id)

      if (s.hasChanged()) {
        return {
          code: s.toString(),
          map: s.generateMap({ hires: true }),
        }
      }
    },
    async writeBundle() {
      for (const [filename, url] of assetContext.renderedFontURLs) {
        const key = 'data:fonts:' + filename
        // Use storage to cache the font data between builds
        let res = await storage.getItemRaw(key)
        if (!res) {
          res = await fetch(url)
            .then(r => r.arrayBuffer())
            .then(r => Buffer.from(r))

          await storage.setItemRaw(key, res)
        }

        // TODO: investigate how we can improve in dev surround
        await fsp.mkdir(publicDir, { recursive: true })
        await fsp.writeFile(joinRelativeURL(publicDir, filename), res)
      }
    },
  }
}
