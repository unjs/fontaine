import { parse } from 'css-tree'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transformCSS } from '../src'

vi.mock('css-tree', async (importOriginal) => {
  const original = await importOriginal<typeof import('css-tree')>()
  return { ...original, parse: vi.fn(original.parse) }
})

async function transform(css: string, processCSSVariables?: boolean | 'font-prefixed-only') {
  const result = await transformCSS({
    dev: true,
    processCSSVariables,
    fontsToPreload: new Map(),
    resolveFontFace: family => ({
      fonts: [{ src: [{ url: `/${family.toLowerCase()}.woff2`, format: 'woff2' }] }],
    }),
  }, css, 'some-id')
  return result.toString()
}

describe('nested blocks', () => {
  beforeEach(() => {
    vi.mocked(parse).mockClear()
  })

  it('does not re-parse custom property values', async () => {
    const css = `:root { --a: initial; --b: 1px solid; --c: var(--a); } .d { --e: 0 0 #0000; color: var(--b); }`
    expect(await transform(css)).toBe(css)
    expect(parse).toHaveBeenCalledTimes(1)
  })

  it('still processes `font-family` and `font` declarations in nested rules', async () => {
    const result = await transform(`.a { --x: initial; div { font-family: Poppins; } } .c { p { font: 12px Lato; } }`)
    expect(result).toContain(`src: url("/poppins.woff2")`)
    expect(result).toContain(`src: url("/lato.woff2")`)
  })

  it('still processes custom properties in nested rules when `processCSSVariables` is enabled', async () => {
    const result = await transform(`.a { div { --font-heading: Lato; } }`, 'font-prefixed-only')
    expect(result).toContain(`src: url("/lato.woff2")`)
  })
})
