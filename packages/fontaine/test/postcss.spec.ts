import type { Root } from 'postcss'
import type { FontainePostcssOptions } from '../src/postcss'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromFile } from '@capsizecss/unpack/fs'
import postcss from 'postcss'
import { describe, expect, it, vi } from 'vitest'
import fontaine from '../src/postcss'

vi.mock('@capsizecss/unpack/fs', { spy: true })

/**
 * Stands in for a preprocessor such as Sass: replaces `@import` rules with the contents of
 * the imported file, attributing the inlined nodes to that file so the generated source map
 * points back at it.
 */
const inlineImports = {
  postcssPlugin: 'inline-imports',
  Once(root: Root) {
    root.walkAtRules('import', (rule) => {
      const from = resolve(dirname(root.source!.input.file!), rule.params.replace(/['"]/g, ''))
      rule.replaceWith(postcss.parse(readFileSync(from, 'utf-8'), { from }))
    })
  },
}

describe('fontaine postcss plugin', () => {
  it('should add fallback font family to `font-family` properties', async () => {
    expect(await process(`
      @font-face {
        font-family: Poppins;
        src: url('poppins.woff2') format('woff2');
      }
      .foo {
        font-family: Poppins;
      }
      .bar {
        font-family: "Poppins", sans-serif;
      }
    `)).toMatchInlineSnapshot(`
      "
            @font-face {
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
              src: url('poppins.woff2') format('woff2');
            }
            .foo {
              font-family: Poppins, "Poppins fallback";
            }
            .bar {
              font-family: "Poppins", "Poppins fallback", sans-serif;
            }
          "
    `)
  })

  it('should transform `@font-face` rules produced by a preprocessor', async () => {
    // Sass inlines partials before the bundler sees them, so fontaine only ever
    // receives the flattened output.
    const compiled = `
      @font-face {
        font-family: "Poppins";
        font-weight: 700;
        src: url("../../fonts/poppins.woff2") format("woff2");
      }
      body {
        font-family: "Poppins", sans-serif;
      }
    `
    expect(await process(compiled)).toContain('font-family: "Poppins", "Poppins fallback", sans-serif;')
    expect(await process(compiled)).toContain('font-weight: 700;')
  })

  it('should not touch `font-family` inside `@font-face`', async () => {
    const result = await process(`
      @font-face {
        font-family: Poppins;
        src: url('poppins.woff2') format('woff2');
      }
    `)
    expect(result).not.toContain('font-family: Poppins, "Poppins fallback"')
  })

  it('should not add fallbacks for generic families or CSS-wide keywords', async () => {
    expect(await process(`
      .foo {
        font-family: sans-serif;
      }
      .bar {
        font-family: inherit;
      }
      .baz {
        font-family: var(--font-family, Poppins);
      }
    `)).toMatchInlineSnapshot(`
      "
            .foo {
              font-family: sans-serif;
            }
            .bar {
              font-family: inherit;
            }
            .baz {
              font-family: var(--font-family, Poppins);
            }
          "
    `)
  })

  it('should not add fallbacks for any generic family or CSS-wide keyword', async () => {
    for (const value of ['sans-serif', 'monospace', 'system-ui', 'inherit', 'initial', 'unset', 'revert', 'revert-layer']) {
      expect(await process(`.foo { font-family: ${value}; }`)).toBe(`.foo { font-family: ${value}; }`)
    }
  })

  it('should add a fallback for a real family followed by a generic family', async () => {
    expect(await process('.foo { font-family: Poppins, sans-serif; }')).toBe('.foo { font-family: Poppins, "Poppins fallback", sans-serif; }')
  })

  it('should add fallbacks for families declared in another stylesheet', async () => {
    expect(await process(`
      body {
        font-family: "DM Sans Variable", sans-serif;
      }
    `)).toContain('font-family: "DM Sans Variable", "DM Sans Variable fallback", sans-serif;')
  })

  it('should still add fallbacks when `@font-face` generation is skipped', async () => {
    const result = await process(`
      @font-face {
        font-family: Poppins;
        src: url('poppins.woff2') format('woff2');
      }
      .foo {
        font-family: Poppins;
      }
    `, { skipFontFaceGeneration: () => true })

    expect(result).toContain('font-family: Poppins, "Poppins fallback";')
    expect(result).not.toContain('size-adjust')
  })

  it('should ignore `font-family` in `@font-face` when generation is skipped', async () => {
    const result = await process(`
      @font-face {
        font-family: Poppins;
        src: url('poppins.woff2') format('woff2');
      }
    `, { skipFontFaceGeneration: () => true })

    expect(result).not.toContain('fallback')
  })

  it('should ignore unsupported extensions', async () => {
    expect(await process(`
      @font-face {
        font-family: Poppins;
        src: url('poppins.eot');
      }
      .foo {
        font-family: Poppins;
      }
    `)).not.toContain('size-adjust')
  })

  it('should read metrics from a font file relative to the stylesheet', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockReset()

    const from = fileURLToPath(new URL('./test.css', import.meta.url))
    await process(`
      @font-face {
        font-family: "Unknown Family";
        src: url('./my.woff2') format('woff2');
      }
      .foo {
        font-family: "Unknown Family";
      }
    `, {}, from)

    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./my.woff2', import.meta.url)))
  })

  it('should resolve bare relative paths against the stylesheet, falling back to `resolvePath`', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockReset()

    const resolvePath = vi.fn((id: string) => id)
    const from = fileURLToPath(new URL('./test.css', import.meta.url))
    await process(`
      @font-face {
        font-family: "Unknown Family";
        src: url('fonts/my.woff2') format('woff2');
      }
    `, { resolvePath }, from)

    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./fonts/my.woff2', import.meta.url)))
    expect(resolvePath).toHaveBeenCalledWith('fonts/my.woff2')
  })

  it('should pass bare package specifiers to `resolvePath`', async () => {
    const from = fileURLToPath(new URL('./test.css', import.meta.url))

    for (const src of ['~@fake-fontsource/dm-sans/files/c.woff2', '@fake-fontsource/dm-sans/files/d.woff2']) {
      const resolvePath = vi.fn((id: string) => id)
      await process(`
        @font-face {
          font-family: "Unknown Family";
          src: url('${src}') format('woff2');
        }
      `, { resolvePath }, from)
      expect(resolvePath).toHaveBeenCalledWith(src)
    }
  })

  it('should prefer the stylesheet-relative path when it yields metrics', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockResolvedValueOnce({
      familyName: 'Resolvable Postcss Font',
      ascent: 1000,
      descent: 200,
      lineGap: 0,
      unitsPerEm: 1000,
      xWidthAvg: 500,
    })

    const resolvePath = vi.fn((id: string) => id)
    const from = fileURLToPath(new URL('./test.css', import.meta.url))
    await process(`
      @font-face {
        font-family: "Resolvable Postcss Font";
        src: url('fonts/resolvable-postcss.woff2') format('woff2');
      }
    `, { resolvePath }, from)

    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./fonts/resolvable-postcss.woff2', import.meta.url)))
    expect(resolvePath).not.toHaveBeenCalled()
  })

  it('should resolve font paths with `resolvePath`', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockReset()

    await process(`
      @font-face {
        font-family: "Unknown Family";
        src: url('/fonts/my.woff2') format('woff2');
      }
    `, { resolvePath: () => new URL('./my.woff2', import.meta.url) })

    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./my.woff2', import.meta.url)))
  })

  it('should resolve font paths against the stylesheet a preprocessor inlined them from', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockReset()

    const entry = fileURLToPath(new URL('./main.css', import.meta.url))
    const compiled = await postcss([inlineImports]).process(`
      @import "./fixtures/_fonts.scss";
      body {
        font-family: "Unknown Family";
      }
    `, { from: entry, to: entry, map: { inline: false } })

    await postcss([fontaine({ fallbacks: ['Arial'] })])
      .process(compiled.css, {
        from: entry,
        map: { prev: compiled.map.toString(), inline: false },
      })

    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./fixtures/my.woff2', import.meta.url)))
  })

  it('should resolve font paths against the stylesheet when the source map has no mapping for the rule', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockReset()

    const entry = fileURLToPath(new URL('./main.css', import.meta.url))
    const prev = JSON.stringify({
      version: 3,
      file: 'main.css',
      sources: ['fixtures/_fonts.scss'],
      names: [],
      mappings: '',
    })

    await postcss([fontaine({ fallbacks: ['Arial'] })])
      .process(`
        @font-face {
          font-family: "Unknown Family";
          src: url('./fixtures/my.woff2') format('woff2');
        }
      `, { from: entry, map: { prev, inline: false } })

    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./fixtures/my.woff2', import.meta.url)))
  })

  it('should not generate `@font-face` rules when no fallback has metrics', async () => {
    const result = await process(`
      @font-face {
        font-family: Poppins;
        src: url('poppins.woff2') format('woff2');
      }
      .foo {
        font-family: Poppins;
      }
    `, { fallbacks: ['Entirely Unknown Font'] })

    expect(result).not.toContain('size-adjust')
    expect(result).toContain('font-family: Poppins, "Poppins fallback";')
  })

  it('should ignore `@font-face` rules without a `src`', async () => {
    expect(await process(`
      @font-face {
        font-family: Poppins;
      }
    `)).not.toContain('size-adjust')
  })

  it('should read metrics from a bare relative font path', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockReset()

    await process(`
      @font-face {
        font-family: "Unknown Family";
        src: url('fonts/my.woff2') format('woff2');
      }
    `, {}, fileURLToPath(new URL('./test.css', import.meta.url)))

    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./fonts/my.woff2', import.meta.url)))
  })

  it('should not resolve root-relative or external font paths against the stylesheet', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockReset()

    const from = fileURLToPath(new URL('./test.css', import.meta.url))
    for (const url of ['/fonts/my.woff2', '//example.com/my.woff2', 'https://example.com/my.woff2']) {
      await process(`
        @font-face {
          font-family: "Unknown Family";
          src: url('${url}') format('woff2');
        }
      `, {}, from)
    }

    expect(fromFile).not.toHaveBeenCalled()
  })

  it('should ignore query strings and fragments when reading metrics', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockReset()

    await process(`
      @font-face {
        font-family: "Unknown Family";
        src: url('./my.woff2?v=1#iefix') format('woff2');
      }
    `, {}, fileURLToPath(new URL('./test.css', import.meta.url)))

    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./my.woff2', import.meta.url)))
  })

  it('should generate one set of fallbacks for a rule with multiple sources', async () => {
    const result = await process(`
      @font-face {
        font-family: Poppins;
        src: url('poppins.woff2') format('woff2'), url('poppins.woff') format('woff');
      }
    `)

    expect(result.match(/local\("Segoe UI"\)/g)).toHaveLength(1)
    expect(result.match(/local\("Arial"\)/g)).toHaveLength(1)
  })

  it('should support a custom `fallbackName`', async () => {
    expect(await process(`
      @font-face {
        font-family: Poppins;
        src: url('poppins.woff2') format('woff2');
      }
      .foo {
        font-family: Poppins;
      }
    `, { fallbackName: name => `${name}-override` })).toContain('font-family: Poppins, "Poppins-override";')
  })
})

function process(
  css: string,
  options: Partial<FontainePostcssOptions> = {},
  from?: string,
) {
  return postcss([
    fontaine({ fallbacks: ['Segoe UI', 'Arial'], ...options }),
  ])
    .process(css, { from })
    .then(result => result.css)
}
