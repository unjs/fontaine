import type { NormalizeFontDataContext } from '../src/assets'
import { describe, expect, it } from 'vitest'
import { normalizeFontData } from '../src/assets'

function createContext(overrides: Partial<NormalizeFontDataContext> = {}): NormalizeFontDataContext {
  return {
    dev: false,
    renderedFontURLs: new Map<string, string>(),
    assetsBaseURL: '/assets/_fonts',
    ...overrides,
  }
}

function urls(context: NormalizeFontDataContext, src: string = 'https://fonts.example.com/font.woff2'): string[] {
  const [face] = normalizeFontData(context, { src: [{ url: src, format: 'woff2' }] })
  return face!.src.map(source => 'url' in source ? source.url : source.name)
}

describe('normalizeFontData', () => {
  it('should serve fonts from the assets base URL by default', () => {
    expect(urls(createContext())[0]).toMatch(/^\/assets\/_fonts\//)
    expect(urls(createContext({ dev: true }))[0]).toMatch(/^\/assets\/_fonts\//)
  })

  it('should prefix font URLs with the base URL', () => {
    expect(urls(createContext({ baseURL: '/build/' }))[0]).toMatch(/^\/build\/assets\/_fonts\//)
    expect(urls(createContext({ baseURL: '/build/', dev: true }))[0]).toMatch(/^\/build\/assets\/_fonts\//)
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
    expect([...context.renderedFontURLs.values()]).toEqual(['https://fonts.example.com/font.woff2'])
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
    expect([...context.renderedFontURLs.values()]).toEqual(['https://fonts.example.com/font.woff2'])
  })

  it('should leave local and relative font sources untouched', () => {
    const context = createContext({ baseURL: '/build/' })
    expect(normalizeFontData(context, { src: 'Some Local Font' })[0]!.src).toEqual([{ name: 'Some Local Font' }])
    expect(urls(context, '/fonts/font.woff2')).toEqual(['/fonts/font.woff2'])
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

  it('should normalise unicode ranges to an array', () => {
    const [face] = normalizeFontData(createContext(), { src: 'Some Local Font', unicodeRange: 'U+0000-00FF' })
    expect(face!.unicodeRange).toEqual(['U+0000-00FF'])
  })
})
