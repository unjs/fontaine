import type { FontFaceData } from 'unifont'
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
import { selectPreloadFonts } from '../src/preload'
import { transformCSS } from '../src/utils'

// Google's return order for Barlow with the default subsets and styles
const barlow: FontFaceData[] = [
  { src: [{ url: '/vietnamese-italic.woff2' }], style: 'italic', weight: 400, unicodeRange: ['U+0102-0103', 'U+1EA0-1EF9'], meta: { priority: 0, subset: 'vietnamese' } },
  { src: [{ url: '/latin-ext-italic.woff2' }], style: 'italic', weight: 400, unicodeRange: ['U+0100-02BA'], meta: { priority: 0, subset: 'latin-ext' } },
  { src: [{ url: '/latin-italic.woff2' }], style: 'italic', weight: 400, unicodeRange: ['U+0000-00FF', 'U+0131'], meta: { priority: 0, subset: 'latin' } },
  { src: [{ url: '/vietnamese.woff2' }], style: 'normal', weight: 400, unicodeRange: ['U+0102-0103', 'U+1EA0-1EF9'], meta: { priority: 0, subset: 'vietnamese' } },
  { src: [{ url: '/latin-ext.woff2' }], style: 'normal', weight: 400, unicodeRange: ['U+0100-02BA'], meta: { priority: 0, subset: 'latin-ext' } },
  { src: [{ url: '/latin.woff2' }], style: 'normal', weight: 400, unicodeRange: ['U+0000-00FF', 'U+0131'], meta: { priority: 0, subset: 'latin' } },
]

function urls(fonts: FontFaceData[]) {
  return fonts.map(font => (font.src[0] as { url: string }).url)
}

describe('selectPreloadFonts', () => {
  it('preloads nothing without a `preload` option', () => {
    expect(selectPreloadFonts('Barlow', barlow, undefined)).toEqual([])
    expect(selectPreloadFonts('Barlow', barlow, false)).toEqual([])
    expect(selectPreloadFonts('Barlow', [], true)).toEqual([])
  })

  it('preloads the upright latin face with `preload: true`', () => {
    expect(urls(selectPreloadFonts('Barlow', barlow, true))).toEqual(['/latin.woff2'])
  })

  it('prefers the first configured subset with `preload: true`', () => {
    expect(urls(selectPreloadFonts('Barlow', barlow, true, ['vietnamese', 'latin']))).toEqual(['/vietnamese.woff2'])
    expect(urls(selectPreloadFonts('Barlow', barlow, true, ['cyrillic']))).toEqual(['/vietnamese.woff2'])

    const unsubsetted: FontFaceData[] = [{ src: [{ url: '/all.woff2' }] }, ...barlow]
    expect(urls(selectPreloadFonts('Barlow', unsubsetted, true, ['latin']))).toEqual(['/latin.woff2'])
  })

  it('prefers lower priority, then the weight closest to 400, with `preload: true`', () => {
    const fonts: FontFaceData[] = [
      { src: [{ url: '/fallback.woff2' }], weight: 400, meta: { priority: 1 } },
      { src: [{ url: '/700.woff2' }], weight: 700 },
      { src: [{ url: '/variable.woff2' }], weight: [300, 800] },
      { src: [{ url: '/300.woff2' }], weight: '300' },
      { src: [{ url: '/bold.woff2' }], weight: 'bold' },
    ]
    expect(urls(selectPreloadFonts('Barlow', fonts, true))).toEqual(['/variable.woff2'])
    expect(urls(selectPreloadFonts('Barlow', fonts.filter(f => !Array.isArray(f.weight)), true))).toEqual(['/300.woff2'])
  })

  it('falls back to the first face when no unicode range covers basic latin', () => {
    const fonts: FontFaceData[] = [
      { src: [{ url: '/symbols.woff2' }], unicodeRange: ['U+1F600-1F64F', 'not-a-range'] },
      { src: [{ url: '/wildcard.woff2' }], unicodeRange: ['U+00??'] },
    ]
    expect(urls(selectPreloadFonts('Barlow', fonts, true))).toEqual(['/wildcard.woff2'])
  })

  it('filters faces with a callback', () => {
    const fonts = selectPreloadFonts('Barlow', barlow, (_family, font) => font.style !== 'italic')
    expect(urls(fonts)).toEqual(['/vietnamese.woff2', '/latin-ext.woff2', '/latin.woff2'])
  })

  it('filters faces by subsets, styles and weights', () => {
    expect(urls(selectPreloadFonts('Barlow', barlow, { subsets: ['latin'] })))
      .toEqual(['/latin-italic.woff2', '/latin.woff2'])
    expect(urls(selectPreloadFonts('Barlow', barlow, { subsets: ['latin'], styles: ['normal'] })))
      .toEqual(['/latin.woff2'])
    expect(urls(selectPreloadFonts('Barlow', barlow, { styles: ['normal'], weights: [400] })))
      .toEqual(['/vietnamese.woff2', '/latin-ext.woff2', '/latin.woff2'])
    expect(urls(selectPreloadFonts('Barlow', barlow, { weights: [700] }))).toEqual([])
  })

  it('matches weights against variable ranges and non-numeric weights', () => {
    const fonts: FontFaceData[] = [
      { src: [{ url: '/variable.woff2' }], weight: [300, 800] },
      { src: [{ url: '/bold.woff2' }], weight: 'bold' },
      { src: [{ url: '/default.woff2' }] },
    ]
    expect(urls(selectPreloadFonts('Barlow', fonts, { weights: [700] }))).toEqual(['/variable.woff2'])
    expect(urls(selectPreloadFonts('Barlow', fonts, { weights: ['bold'] }))).toEqual(['/bold.woff2'])
    expect(urls(selectPreloadFonts('Barlow', fonts, { weights: [400] }))).toEqual(['/variable.woff2', '/default.woff2'])
  })
})

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

  it('preloads a single font with `preload: true`', { timeout: 20_000 }, async () => {
    const byDefault = await buildApp({ families: [{ name: 'Poppins', preload: true }] })
    expect(byDefault).toHaveLength(1)

    const latinOnly = await buildApp({
      families: [{ name: 'Poppins', preload: true, subsets: ['latin'] }],
      defaults: { styles: ['normal'] },
    })
    expect(byDefault).toEqual(latinOnly)
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
