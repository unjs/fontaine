import type { FontFamilyInjectionPluginOptions } from '../src/utils'
import { describe, expect, it } from 'vitest'
import { transformCSS } from '../src/utils'

const font = { src: [{ url: '/inter.woff2', format: 'woff2' }] }

function transform(code: string, options: Partial<FontFamilyInjectionPluginOptions> = {}, opts?: { relative?: boolean }) {
  return transformCSS({
    dev: true,
    fontsToPreload: new Map<string, Set<string>>(),
    resolveFontFace: () => ({ fonts: [font] }),
    ...options,
  }, code, '/css/style.css', opts).then(result => result.toString())
}

describe('transformCSS', () => {
  it('should insert after `@layer` statements but not after a `@layer` block', async () => {
    const withPrelude = await transform(`@layer base;\n:root { font-family: 'Inter' }`)
    expect(withPrelude.indexOf('@font-face')).toBeGreaterThan(withPrelude.indexOf('@layer base;'))

    const withBlock = await transform(`@layer { :root { font-family: 'Inter' } }`)
    expect(withBlock.indexOf('@font-face')).toBeLessThan(withBlock.indexOf('@layer'))
  })

  it('should not inject anything when the family resolves to no fonts', async () => {
    const code = `:root { font-family: 'Inter' }`

    expect(await transform(code, { resolveFontFace: () => ({ fonts: [] }) })).toBe(code)
    expect(await transform(code, { resolveFontFace: () => undefined })).toBe(code)
  })

  it('should rewrite font URLs relative to the stylesheet when asked', async () => {
    const result = await transform(`:root { font-family: 'Inter' }`, {}, { relative: true })

    expect(result).toContain('url("../inter.woff2")')
  })

  it('should not preload fonts that have no remote source', async () => {
    const fontsToPreload = new Map<string, Set<string>>()
    await transform(`:root { font-family: 'Inter' }`, {
      fontsToPreload,
      resolveFontFace: () => ({ fonts: [{ src: [{ name: 'Inter Var' }] }] }),
      selectFontsToPreload: (_family, fonts) => fonts,
    })

    expect(fontsToPreload.size).toBe(0)
  })

  it('should emit fallbacks without the primary `@font-face` when `fallbacksOnly` is set', async () => {
    const result = await transform(`:root { font-family: 'Poppins' }`, {
      resolveFontFace: () => ({
        fonts: [{ src: [{ url: '/poppins.woff2', format: 'woff2' }] }],
        fallbacks: ['Arial'],
        fallbacksOnly: true,
      }),
    })

    expect(result).toContain(`font-family: "Poppins Fallback: Arial"`)
    expect(result).toContain(`font-family: 'Poppins', "Poppins Fallback: Arial"`)
    expect(result).not.toContain(`font-family: 'Poppins';`)
  })

  it('should emit the primary `@font-face` alongside fallbacks by default', async () => {
    const result = await transform(`:root { font-family: 'Poppins' }`, {
      resolveFontFace: () => ({
        fonts: [{ src: [{ url: '/poppins.woff2', format: 'woff2' }] }],
        fallbacks: ['Arial'],
      }),
    })

    expect(result).toContain(`font-family: 'Poppins';`)
    expect(result).toContain(`font-family: "Poppins Fallback: Arial"`)
    expect(result).toContain(`font-family: 'Poppins', "Poppins Fallback: Arial"`)
  })

  it('should not register preloads when `fallbacksOnly` is set', async () => {
    const fontsToPreload = new Map<string, Set<string>>()
    await transform(`:root { font-family: 'Poppins' }`, {
      fontsToPreload,
      selectFontsToPreload: (_family, fonts) => fonts,
      resolveFontFace: () => ({
        fonts: [{ src: [{ url: '/poppins.woff2', format: 'woff2' }] }],
        fallbacks: ['Arial'],
        fallbacksOnly: true,
      }),
    })

    expect(fontsToPreload.size).toBe(0)
  })

  it('should leave usage sites untouched when `fallbacksOnly` is set and no fallbacks resolve', async () => {
    const result = await transform(`:root { font-family: 'Poppins' }`, {
      resolveFontFace: () => ({
        fonts: [{ src: [{ url: '/poppins.woff2', format: 'woff2' }] }],
        fallbacks: [],
        fallbacksOnly: true,
      }),
    })

    expect(result).not.toContain('@font-face')
    expect(result).toBe(`:root { font-family: 'Poppins' }`)
  })

  it('should minify generated declarations outside dev', async () => {
    const result = await transform(`:root { font-family: 'Inter' }`, { dev: false })

    expect(result).toContain('@font-face{font-family:Inter')
  })

  it('should keep the unminified declaration when minification produces no output', async () => {
    const result = await transform(`:root { font-family: 'Inter' }`, {
      dev: false,
      lightningcssOptions: { include: 0, exclude: 0, targets: { chrome: 1 << 16 } } as any,
      resolveFontFace: () => ({ fonts: [{ src: [{ url: '/inter.woff2', format: 'woff2' }], unicodeRange: ['U+0000-00FF'] }] }),
    })

    expect(result).toContain('@font-face')
  })

  it('should fall back to unminified CSS when minification throws', async () => {
    const result = await transform(`:root { font-family: 'Inter' }`, {
      dev: false,
      lightningcssOptions: { targets: { chrome: 'not-a-version' } } as any,
    })

    expect(result).toContain('font-family: \'Inter\';')
  })
})
