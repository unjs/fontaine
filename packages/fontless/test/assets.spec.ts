import type { NormalizeFontDataContext, RenderedFont } from '../src/assets'
import { pathToFileURL } from 'node:url'
import { join } from 'pathe'
import { describe, expect, it } from 'vitest'
import { normalizeFontData } from '../src/assets'
import { normalizeGlyphs } from '../src/subset'

/** Whether a CSS `unicode-range` value covers a character, as a browser would read it. */
function covers(range: string[], character: string): boolean {
  const codepoint = character.codePointAt(0)!
  return range.some((entry) => {
    const [start, end] = entry.replace('U+', '').split('-')
    return codepoint >= Number.parseInt(start!, 16) && codepoint <= Number.parseInt(end ?? start!, 16)
  })
}

function createContext(overrides: Partial<NormalizeFontDataContext> = {}): NormalizeFontDataContext {
  return {
    renderedFontURLs: new Map<string, RenderedFont>(),
    assetsBaseURL: '/assets/_fonts',
    ...overrides,
  }
}

function urls(context: NormalizeFontDataContext, src: string = 'https://fonts.example.com/font.woff2'): string[] {
  const [face] = normalizeFontData(context, { src: [{ url: src, format: 'woff2' }] })
  return face!.src.map(source => 'url' in source ? source.url : source.name)
}

describe('normalizeFontData', () => {
  it('should emit the same file name for a local font resolved from a different root', () => {
    const fileName = (root: string) => {
      const context = createContext({ root })
      normalizeFontData(context, { src: [{ url: pathToFileURL(join(root, 'node_modules/@fontsource/inter/inter.woff2')).href, format: 'woff2' }] })
      return [...context.renderedFontURLs.keys()][0]
    }

    expect(fileName('/home/ci/app')).toBe(fileName('/Users/daniel/code/app'))
  })

  it('should serve fonts from the assets base URL by default', () => {
    expect(urls(createContext())[0]).toMatch(/^\/assets\/_fonts\//)
  })

  it('should prefix font URLs with the base URL', () => {
    expect(urls(createContext({ baseURL: '/build/' }))[0]).toMatch(/^\/build\/assets\/_fonts\//)
  })

  it('should support a base URL pointing at another origin', () => {
    expect(urls(createContext({ baseURL: 'https://cdn.example.com/build/' }))[0])
      .toMatch(/^https:\/\/cdn\.example\.com\/build\/assets\/_fonts\//)
  })

  it('should preserve the original URL and register the rendered file', () => {
    const context = createContext({ baseURL: '/build/' })
    const [face] = normalizeFontData(context, { src: 'https://fonts.example.com/font.woff2' })
    const [source] = face!.src as [{ url: string, originalURL?: string }]

    expect(source.originalURL).toBe('https://fonts.example.com/font.woff2')
    expect([...context.renderedFontURLs.values()]).toEqual([{ url: 'https://fonts.example.com/font.woff2', init: undefined }])
    expect(source.url.endsWith([...context.renderedFontURLs.keys()][0]!)).toBe(true)
  })

  it('should report rendered fonts to the callback with their public URL', () => {
    const seen: Array<[string, string]> = []
    const context = createContext({ baseURL: '/build/', callback: (file, url) => void seen.push([file, url]) })
    normalizeFontData(context, { src: 'https://fonts.example.com/font.woff2' })

    expect(seen).toHaveLength(1)
    expect(seen[0]![1]).toBe(`/build/assets/_fonts/${seen[0]![0]}`)
  })

  it('should upgrade protocol-relative URLs to https', () => {
    const context = createContext()
    normalizeFontData(context, { src: '//fonts.example.com/font.woff2' })
    expect([...context.renderedFontURLs.values()]).toEqual([{ url: 'https://fonts.example.com/font.woff2', init: undefined }])
  })

  it('should leave local and relative font sources untouched', () => {
    const context = createContext({ baseURL: '/build/' })
    expect(normalizeFontData(context, { src: 'Some Local Font' })[0]!.src).toEqual([{ name: 'Some Local Font' }])
    expect(urls(context, '/fonts/font.woff2')).toEqual(['/fonts/font.woff2'])
    expect(context.renderedFontURLs.size).toBe(0)
  })

  it('should not download font sources with unsupported protocols', () => {
    const context = createContext()
    expect(urls(context, 'javascript:alert(1)')).toEqual(['javascript:alert(1)'])
    expect(urls(context, 'blob:https://fonts.example.com/0000')).toEqual(['blob:https://fonts.example.com/0000'])
    expect(context.renderedFontURLs.size).toBe(0)
  })

  it('should hash the whole URL when it has no filename', () => {
    const context = createContext()
    normalizeFontData(context, { src: [{ url: 'https://fonts.example.com/', format: 'woff2' }] })
    normalizeFontData(context, { src: [{ url: 'https://other.example.com/', format: 'woff2' }] })

    const files = [...context.renderedFontURLs.keys()]
    expect(files).toHaveLength(2)
    expect(files[0]).not.toBe(files[1])
    expect(files.every(file => file.endsWith('.woff2'))).toBe(true)
  })

  it('should derive the extension from the format when the URL has none', () => {
    const context = createContext()
    normalizeFontData(context, { src: [{ url: 'https://fonts.example.com/font', format: 'woff2' }] })

    expect([...context.renderedFontURLs.keys()][0]).toMatch(/\.woff2$/)
  })

  it('should emit no extension when neither the URL nor the format provides one', () => {
    const context = createContext()
    normalizeFontData(context, { src: [{ url: 'https://fonts.example.com/font', format: 'unknown-format' }] })

    expect([...context.renderedFontURLs.keys()][0]).not.toContain('.')
  })

  it('should register the request init a provider requires for a font', () => {
    const context = createContext()
    const init = { headers: { authorization: 'Bearer token' } }
    normalizeFontData(context, { src: [{ url: 'https://fonts.example.com/font.woff2', format: 'woff2' }], meta: { init } })

    expect([...context.renderedFontURLs.values()][0]!.init).toEqual(init)
  })

  it('should normalise unicode ranges to an array', () => {
    const [face] = normalizeFontData(createContext(), { src: 'Some Local Font', unicodeRange: 'U+0000-00FF' })
    expect(face!.unicodeRange).toEqual(['U+0000-00FF'])
  })

  it('should declare a unicode range covering the glyphs a locally subsetted face was reduced to', () => {
    const glyphs = normalizeGlyphs('Hand')!
    const [face] = normalizeFontData(createContext(), { src: [{ url: 'https://fonts.example.com/font.woff2', format: 'woff2' }] }, { glyphs })
    const range = face!.unicodeRange!

    expect(range).toEqual(['U+0048', 'U+0061', 'U+0064', 'U+006E'])
    for (const character of glyphs) {
      expect(covers(range, character)).toBe(true)
    }
    expect(covers(range, 'z')).toBe(false)
  })

  it('should coalesce consecutive codepoints into ranges', () => {
    const [face] = normalizeFontData(createContext(), { src: [{ url: 'https://fonts.example.com/font.woff2', format: 'woff2' }] }, { glyphs: normalizeGlyphs('abcdez0') })

    expect(face!.unicodeRange).toEqual(['U+0030', 'U+0061-0065', 'U+007A'])
  })

  it('should keep a unicode range the provider declared', () => {
    const [face] = normalizeFontData(createContext(), { src: [{ url: 'https://fonts.example.com/font.woff2', format: 'woff2' }], unicodeRange: 'U+0000-00FF' }, { glyphs: normalizeGlyphs('Hand') })

    expect(face!.unicodeRange).toEqual(['U+0000-00FF'])
  })

  it('should not declare a unicode range for a face with no emitted file', () => {
    const [face] = normalizeFontData(createContext(), { src: 'Some Local Font' }, { glyphs: normalizeGlyphs('Hand') })

    expect(face!.unicodeRange).toBeUndefined()
  })
})
