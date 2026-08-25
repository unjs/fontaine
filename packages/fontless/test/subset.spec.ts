import type { InlineConfig } from 'vite'
import type { FontlessOptions } from '../src/types'
import { Buffer } from 'node:buffer'
import { promises as fsp } from 'node:fs'
import { createServer as createHttpServer } from 'node:http'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'pathe'
import { build, createServer } from 'vite'
import { afterAll, describe, expect, it } from 'vitest'
import { fontless } from '../src'
import { normalizeGlyphs, subsetFontData } from '../src/subset'

const fixture = fileURLToPath(new URL('fixtures/font.woff2', import.meta.url))
const scratchDirs: string[] = []

afterAll(async () => {
  await Promise.all(scratchDirs.map(dir => fsp.rm(dir, { recursive: true, force: true })))
})

const html = '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body></body></html>'

async function createFixture(styles: string) {
  const root = await fsp.mkdtemp(join(tmpdir(), 'fontless-subset-'))
  scratchDirs.push(root)
  await fsp.writeFile(join(root, 'index.html'), html)
  await fsp.writeFile(join(root, 'style.css'), styles)
  await fsp.copyFile(fixture, join(root, 'font.woff2'))
  return root
}

function manualFamily(name: string, glyphs?: string | string[]) {
  return { name, src: [{ url: pathToFileURL(fixture).href, format: 'woff2' }], glyphs }
}

async function buildApp(root: string, options: FontlessOptions, config: InlineConfig = {}) {
  const outDir = await fsp.mkdtemp(join(tmpdir(), 'fontless-subset-out-'))
  scratchDirs.push(outDir)

  await build({
    ...config,
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [fontless(options)],
    build: { outDir, emptyOutDir: true },
  })

  const files = await Array.fromAsync(fsp.glob('**/*.woff2', { cwd: outDir }))
  const fonts = await Promise.all(files.sort().map(file => fsp.readFile(join(outDir, file))))
  return { files, fonts }
}

async function serveFont(root: string, options: FontlessOptions) {
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0 },
    plugins: [fontless(options)],
  })

  try {
    await server.listen()
    const transformed = await server.transformRequest('/style.css')
    const file = transformed!.code.match(/\/assets\/_fonts\/([\w-]+\.woff2)/)![1]
    const response = await fetch(new URL(`/assets/_fonts/${file}`, server.resolvedUrls!.local[0]))
    return Buffer.from(await response.arrayBuffer())
  }
  finally {
    await server.close()
  }
}

describe('normalizeGlyphs', () => {
  it('should return nothing when no glyphs are configured', () => {
    expect(normalizeGlyphs()).toBeUndefined()
    expect(normalizeGlyphs('')).toBeUndefined()
    expect(normalizeGlyphs([])).toBeUndefined()
  })

  it('should produce the same value for equivalent glyph lists', () => {
    expect(normalizeGlyphs('Hand')).toBe(normalizeGlyphs(['d', 'n', 'a', 'H', 'a']))
    expect(normalizeGlyphs('Hand')).not.toBe(normalizeGlyphs('Hands'))
  })
})

describe('subsetFontData', () => {
  it('should fall back to the original font when subsetting fails', async () => {
    const font = Buffer.from('not-really-a-font')

    expect(await subsetFontData(font, 'Hand', 'https://example.com/font.woff2')).toBe(font)
  })
})

describe('glyph subsetting', () => {
  it('should emit the font untouched when no glyphs are configured', { timeout: 20_000 }, async () => {
    const root = await createFixture(`body { font-family: 'Inter' }`)
    const { fonts } = await buildApp(root, { families: [manualFamily('Inter')] })

    expect(fonts[0]).toEqual(await fsp.readFile(fixture))
  })

  it('should emit a smaller, still parseable font when glyphs are configured', { timeout: 20_000 }, async () => {
    const root = await createFixture(`body { font-family: 'Inter' }`)
    const { fonts } = await buildApp(root, { families: [manualFamily('Inter', 'Hand')] })
    const [font] = fonts as [Buffer]

    expect(font.length).toBeLessThan((await fsp.readFile(fixture)).length)
    expect(font.subarray(0, 4).toString()).toBe('wOF2')
    // a font harfbuzz can subset again is a font harfbuzz could parse
    expect((await subsetFontData(font, 'Hand', fixture)).length).toBeGreaterThan(0)
  })

  it('should accept glyphs as a list of characters, and as a default for every family', { timeout: 20_000 }, async () => {
    const root = await createFixture(`body { font-family: 'Inter' }`)
    const fromList = await buildApp(root, { families: [manualFamily('Inter', ['H', 'a', 'n', 'd'])] })
    const fromDefaults = await buildApp(root, { defaults: { glyphs: 'Hand' }, families: [manualFamily('Inter')] })

    expect(fromDefaults.fonts[0]).toEqual(fromList.fonts[0])
  })

  it('should emit one file per glyph list for the same source font', { timeout: 20_000 }, async () => {
    const root = await createFixture(`h1 { font-family: 'Inter' } p { font-family: 'Erode' }`)
    const { files, fonts } = await buildApp(root, {
      families: [manualFamily('Inter', 'Hand'), manualFamily('Erode', 'Handgloves')],
    })

    expect(files).toHaveLength(2)
    expect(fonts[0]).not.toEqual(fonts[1])
  })

  it('should subset fonts downloaded from a provider', { timeout: 20_000 }, async () => {
    const font = await fsp.readFile(fixture)
    const host = createHttpServer((_req, res) => res.end(font))
    await new Promise<void>(resolve => host.listen(0, '127.0.0.1', resolve))
    const { port } = host.address() as { port: number }

    try {
      const root = await createFixture(`body { font-family: 'Inter' }`)
      const { fonts } = await buildApp(root, {
        cache: false,
        families: [{ name: 'Inter', src: [{ url: `http://127.0.0.1:${port}/font.woff2`, format: 'woff2' }], glyphs: 'Hand' }],
      })

      expect(fonts[0]!.length).toBeLessThan(font.length)
    }
    finally {
      host.close()
    }
  })

  it('should serve subsetted bytes from the dev middleware', { timeout: 20_000 }, async () => {
    const root = await createFixture(`body { font-family: 'Inter' }`)
    const subsetted = await serveFont(root, { families: [manualFamily('Inter', 'Hand')] })
    const untouched = await serveFont(root, { families: [manualFamily('Inter')] })

    expect(subsetted.length).toBeLessThan(untouched.length)
    expect(untouched).toEqual(await fsp.readFile(fixture))
  })
})
