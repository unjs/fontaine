import type { RollupPlugin } from 'unplugin'
import { describe, expect, it } from 'vitest'
import { FontaineTransform } from '../src'

describe('fontaine transform', () => {
  it('should add fallback font family to `font-family` properties', async () => {
    expect(await transform(`
      .foo {
        font-family: Poppins;
      }
      .bar {
        font-family: var(--font-family, Poppins);
      }
    `))
      .toMatchInlineSnapshot(`
      ".foo {
        font-family: Poppins, "Poppins fallback";
      }
      .bar {
        font-family: var(--font-family, Poppins);
      }"
    `)
  })

  it('should add additional @font-face declarations', async () => {
    expect(await transform(`
      @font-face {
        font-family: Poppins;
        src: url('poppins.ttf');
      }
    `))
      .toMatchInlineSnapshot(`
      "@font-face {
        font-family: "Poppins fallback";
        src: local("Segoe UI");
        size-adjust: 112.7753%;
        ascent-override: 93.1055%;
        descent-override: 31.0352%;
        line-gap-override: 8.8672%;
      }
      @font-face {
        font-family: "Poppins fallback";
        src: local("Arial");
        size-adjust: 112.1577%;
        ascent-override: 93.6182%;
        descent-override: 31.2061%;
        line-gap-override: 8.916%;
      }
      @font-face {
        font-family: Poppins;
        src: url('poppins.ttf');
      }"
    `)
  })
})

async function transform(css: string) {
  const plugin = FontaineTransform.rollup({
    fallbacks: ['Arial', 'Segoe UI'],
  }) as RollupPlugin
  const result = await (plugin.transform as any)(css, 'test.css')
  return result?.code.replace(/^ {6}/gm, '').trim()
}
