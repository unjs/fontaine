import type { InlineConfig } from 'vite'
import type { FontlessOptions } from '../src/types'
import type { FontFamilyInjectionPluginOptions } from '../src/utils'
import { promises as fsp } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join } from 'pathe'
import { build } from 'vite'
import { afterAll, describe, expect, it } from 'vitest'
import { fontless } from '../src'
import { transformCSS } from '../src/utils'

describe('transformCSS preload selection', () => {
  const fonts = [
    { src: [{ url: '/font-latin.woff2', format: 'woff2' }], meta: { priority: 1, subset: 'latin' } },
    { src: [{ url: '/font-greek.woff2', format: 'woff2' }], meta: { priority: 1, subset: 'greek' } },
    { src: [{ url: '/font-top.woff2', format: 'woff2' }], meta: { priority: 0 } },
  ]

  async function transform(options: Partial<FontFamilyInjectionPluginOptions>) {
    const fontsToPreload = new Map<string, Set<string>>()
    await transformCSS({
      dev: true,
      fontsToPreload,
      resolveFontFace: () => ({ fonts }),
      ...options,
    }, `:root { font-family: 'Poppins' }`, 'some-id')
    return [...fontsToPreload.get('some-id') || []]
  }

  it('preloads nothing by default', async () => {
    expect(await transform({})).toEqual([])
  })

  it('passes all fonts, sorted by priority, to `selectFontsToPreload`', async () => {
    const received: string[][] = []
    const urls = await transform({
      selectFontsToPreload: (_family, fonts) => {
        received.push(fonts.map(f => f.meta!.subset as string ?? 'top'))
        return fonts.filter(f => f.meta?.subset === 'greek')
      },
    })
    expect(received).toEqual([['top', 'latin', 'greek']])
    expect(urls).toEqual(['/font-greek.woff2'])
  })
})

describe('preload option', () => {
  const root = fileURLToPath(new URL('../examples/vanilla-app', import.meta.url))
  const outDirs: string[] = []

  afterAll(async () => {
    await Promise.all(outDirs.map(dir => fsp.rm(dir, { recursive: true, force: true })))
  })

  async function buildApp(fontlessOptions: FontlessOptions, config: Omit<InlineConfig, 'root' | 'configFile' | 'logLevel'> = {}) {
    const outDir = await fsp.mkdtemp(join(tmpdir(), 'fontless-preload-'))
    outDirs.push(outDir)

    await build({
      ...config,
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [fontless(fontlessOptions)],
      build: { ...config.build, outDir, emptyOutDir: true },
    })

    const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outDir }))
    const html = await readFile(join(outDir, files.find(file => file.endsWith('.html'))!), 'utf-8')
    return [...html.matchAll(/rel="preload" as="font" href="([^"]+)"/g)].map(([, url]) => url!)
  }

  it('adds no preload links by default', { timeout: 20_000 }, async () => {
    expect(await buildApp({ families: [{ name: 'Poppins' }] })).toEqual([])
  })

  it('preloads the top priority font with `preload: true`', { timeout: 20_000 }, async () => {
    expect(await buildApp({ families: [{ name: 'Poppins', preload: true }] })).toHaveLength(1)
  })

  it('preloads fonts matching `preload.subsets`', { timeout: 20_000 }, async () => {
    const bySubsets = await buildApp({ families: [{ name: 'Poppins', preload: { subsets: ['latin'] } }] })
    expect(bySubsets.length).toBeGreaterThan(0)

    const byFunction = await buildApp({ families: [{ name: 'Poppins', preload: (_family, font) => font.meta?.subset === 'latin' }] })
    expect(byFunction).toEqual(bySubsets)
  })

  it('respects `defaults.preload` as a fallback for family overrides', { timeout: 20_000 }, async () => {
    const all = await buildApp({ defaults: { preload: true } })
    const withoutPoppins = await buildApp({
      families: [{ name: 'Poppins', preload: false }],
      defaults: { preload: true },
    })
    expect(all.length).toBe(withoutPoppins.length + 1)
    expect(all).toEqual(expect.arrayContaining(withoutPoppins))
  })
})
