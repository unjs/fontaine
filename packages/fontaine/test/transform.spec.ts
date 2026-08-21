import type { RollupPlugin } from 'unplugin'
import type { FontaineTransformOptions } from '../src/transform'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { fromUrl } from '@capsizecss/unpack'
import { fromFile } from '@capsizecss/unpack/fs'
import { describe, expect, it, vi } from 'vitest'
import { FontaineTransform } from '../src'

vi.mock('@capsizecss/unpack', { spy: true })
vi.mock('@capsizecss/unpack/fs', { spy: true })

describe('fontaine transform', () => {
  it('should not process non-CSS files', async () => {
    expect(await transform('.foo { font-family: Poppins; }', {}, 'test.vue')).toBeUndefined()
    expect(await transform('.foo { font-family: Poppins; }', {}, 'test.vue?lang=.css')).not.toBeUndefined()
  })

  it('should add fallback font family to `font-family` properties', async () => {
    expect(await transform(`
      .foo {
        font-family: Poppins;
      }
      .bar {
        font-family: var(--font-family, Poppins);
      }
      .baz {
        font-family: "Poppins Regular";
      }
    `))
      .toMatchInlineSnapshot(`
        ".foo {
          font-family: Poppins, "Poppins fallback";
        }
        .bar {
          font-family: var(--font-family, Poppins);
        }
        .baz {
          font-family: "Poppins Regular", "Poppins Regular fallback";
        }"
      `)
  })

  it('should not add fallbacks for generic families or CSS-wide keywords', async () => {
    for (const value of ['sans-serif', 'monospace', 'system-ui', 'inherit', 'initial', 'unset', 'revert', 'revert-layer']) {
      expect(await transform(`.foo { font-family: ${value}; }`)).toBeUndefined()
    }
  })

  it('should add a fallback for a real family followed by a generic family', async () => {
    expect(await transform('.foo { font-family: Poppins, sans-serif; }'))
      .toMatchInlineSnapshot(`".foo { font-family: Poppins, "Poppins fallback", sans-serif; }"`)
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

  it('should add additional font properties to declarations', async () => {
    expect(await transform(`
      @font-face {
        font-family: Poppins;
        src: url('poppins.ttf');
        font-weight: 700;
        font-style: oblique 10deg;
        font-stretch: 75%;
    }`)).toMatchInlineSnapshot(`
      "@font-face {
        font-family: "Poppins fallback";
        src: local("Segoe UI");
        size-adjust: 112.7753%;
        ascent-override: 93.1055%;
        descent-override: 31.0352%;
        line-gap-override: 8.8672%;
        font-weight: 700;
        font-style: oblique 10deg;
        font-stretch: 75%;
      }
      @font-face {
        font-family: "Poppins fallback";
        src: local("Arial");
        size-adjust: 112.1577%;
        ascent-override: 93.6182%;
        descent-override: 31.2061%;
        line-gap-override: 8.916%;
        font-weight: 700;
        font-style: oblique 10deg;
        font-stretch: 75%;
      }
      @font-face {
        font-family: Poppins;
        src: url('poppins.ttf');
        font-weight: 700;
        font-style: oblique 10deg;
        font-stretch: 75%;
          }"
    `)
  })

  it('should read metrics from URLs', async () => {
    await transform(`
      @font-face {
        font-family: 'Unique Font';
        src: url('https://roe.dev/my.ttf');
      }
    `)
    expect(fromUrl).toHaveBeenCalledWith('https://roe.dev/my.ttf')
  })

  it('should read metrics from local paths', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockReset()
    await transform(`
      @font-face {
        font-family: 'Unique Font';
        src: url('./resolve-path.ttf');
      }
    `, { resolvePath: id => new URL(id, import.meta.url) })
    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./resolve-path.ttf', import.meta.url)))

    // @ts-expect-error not typed as mock
    fromFile.mockReset()
    const cssFilename = fileURLToPath(new URL('./test.css', import.meta.url))
    await transform(`
      @font-face {
        font-family: 'Unique Font';
        src: url('./relative-to-importer.ttf');
      }
    `, {}, cssFilename)
    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./relative-to-importer.ttf', import.meta.url)))
  })

  it('should resolve bare relative paths against the stylesheet, falling back to `resolvePath`', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockReset()
    const resolvePath = vi.fn((id: string) => id)
    const cssFilename = fileURLToPath(new URL('./test.css', import.meta.url))
    await transform(`
      @font-face {
        font-family: 'Unique Font';
        src: url('fonts/my.ttf');
      }
    `, { resolvePath }, cssFilename)
    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./fonts/my.ttf', import.meta.url)))
    expect(resolvePath).toHaveBeenCalledWith('fonts/my.ttf')
  })

  it('should not resolve root-relative, protocol-relative or absolute URLs against the stylesheet', async () => {
    const cssFilename = fileURLToPath(new URL('./test.css', import.meta.url))
    const resolvePath = vi.fn((id: string) => id)

    for (const src of ['/fonts/my.ttf', '//example.com/my.ttf', 'https://example.com/my.ttf']) {
      await transform(`
        @font-face {
          font-family: 'Unique Font';
          src: url('${src}');
        }
      `, { resolvePath }, cssFilename)
      expect(resolvePath).toHaveBeenCalledWith(src)
    }
  })

  it('should ignore query strings and fragments in font URLs', async () => {
    for (const suffix of ['?v=1', '#iefix']) {
      // @ts-expect-error not typed as mock
      fromFile.mockReset()
      const cssFilename = fileURLToPath(new URL('./test.css', import.meta.url))
      await transform(`
        @font-face {
          font-family: 'Unique Font';
          src: url('./my.ttf${suffix}');
        }
      `, {}, cssFilename)
      expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./my.ttf', import.meta.url)))
    }
  })

  it('should pass bare package specifiers to `resolvePath`', async () => {
    const cssFilename = fileURLToPath(new URL('./test.css', import.meta.url))

    for (const src of ['~@fake-fontsource/dm-sans/files/a.woff2', '@fake-fontsource/dm-sans/files/b.woff2']) {
      const resolvePath = vi.fn((id: string) => id)
      await transform(`
        @font-face {
          font-family: 'Unique Font';
          src: url('${src}');
        }
      `, { resolvePath }, cssFilename)
      expect(resolvePath).toHaveBeenCalledWith(src)
    }
  })

  it('should prefer the stylesheet-relative path when it yields metrics', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockResolvedValueOnce({
      familyName: 'Resolvable Font',
      ascent: 1000,
      descent: 200,
      lineGap: 0,
      unitsPerEm: 1000,
      xWidthAvg: 500,
    })

    const resolvePath = vi.fn((id: string) => id)
    const cssFilename = fileURLToPath(new URL('./test.css', import.meta.url))
    await transform(`
      @font-face {
        font-family: 'Resolvable Font';
        src: url('fonts/resolvable.woff2');
      }
    `, { resolvePath }, cssFilename)

    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./fonts/resolvable.woff2', import.meta.url)))
    expect(resolvePath).not.toHaveBeenCalled()
  })

  it('should generate @font-face rules for fonts pulled in via CSS `@import`', async () => {
    const cssFilename = fileURLToPath(new URL('./test.css', import.meta.url))
    expect(await transform(`
      @import "./fixtures/imported.css";
      .foo {
        font-family: Poppins;
      }
    `, {}, cssFilename))
      .toMatchInlineSnapshot(`
        "@import "./fixtures/imported.css";
        @font-face {
          font-family: "Poppins fallback";
          src: local("Segoe UI");
          size-adjust: 112.7753%;
          ascent-override: 93.1055%;
          descent-override: 31.0352%;
          line-gap-override: 8.8672%;
          font-weight: 400;
        }

        @font-face {
          font-family: "Poppins fallback";
          src: local("Arial");
          size-adjust: 112.1577%;
          ascent-override: 93.6182%;
          descent-override: 31.2061%;
          line-gap-override: 8.916%;
          font-weight: 400;
        }

        .foo {
          font-family: Poppins, "Poppins fallback";
        }"
      `)
  })

  it('should follow nested and circular CSS `@import`s without looping', async () => {
    const cssFilename = fileURLToPath(new URL('./test.css', import.meta.url))
    const result = await transform(`
      @import "./fixtures/nested.css";
      .foo {
        font-family: Poppins;
      }
    `, {}, cssFilename)
    expect(result).toContain('font-family: "Poppins fallback"')
  })

  it('should resolve `~`-prefixed imports in SCSS files with line comments', async () => {
    const scssFilename = fileURLToPath(new URL('./fixtures/with-comments.scss', import.meta.url))
    const scss = await readFile(scssFilename, 'utf-8')
    expect(await transform(scss, {}, scssFilename))
      .toMatchInlineSnapshot(`
        "// [Poppins Variable]
        @import "~@fake-fontsource/dm-sans";
        @font-face {
          font-family: "Poppins fallback";
          src: local("Segoe UI");
          size-adjust: 112.7753%;
          ascent-override: 93.1055%;
          descent-override: 31.0352%;
          line-gap-override: 8.8672%;
          font-weight: 400;
        }

        @font-face {
          font-family: "Poppins fallback";
          src: local("Arial");
          size-adjust: 112.1577%;
          ascent-override: 93.6182%;
          descent-override: 31.2061%;
          line-gap-override: 8.916%;
          font-weight: 400;
        }

        // url(https://example.com/not-a-comment.css)
        .foo {
          font-family: Poppins, "Poppins fallback";
        }"
      `)
  })

  it('should not treat `//` inside strings, comments or `url()` as a line comment', async () => {
    expect(await transform(`
      /* https://example.com/block.css */
      .foo {
        background: url(https://example.com/a.png);
        content: 'https://example.com';
        font-family: Poppins;
      }
    `, {}, 'test.scss'))
      .toMatchInlineSnapshot(`
        "/* https://example.com/block.css */
        .foo {
          background: url(https://example.com/a.png);
          content: 'https://example.com';
          font-family: Poppins, "Poppins fallback";
        }"
      `)
  })

  it('should tolerate unterminated strings, comments and `url()` in SCSS', async () => {
    expect(await transform(`.foo { font-family: Poppins; } /* unterminated`, {}, 'test.scss'))
      .toContain('"Poppins fallback"')
    expect(await transform(`.foo { font-family: Poppins; } // trailing`, {}, 'test.scss'))
      .toContain('"Poppins fallback"')
    expect(await transform(`.foo { font-family: Poppins; background: url(unterminated`, {}, 'test.scss'))
      .toContain('"Poppins fallback"')
    expect(await transform(`.foo { font-family: Poppins; content: 'unterminated`, {}, 'test.scss'))
      .toContain('"Poppins fallback"')
  })

  it('should ignore conditional, remote and unresolvable CSS `@import`s', async () => {
    const cssFilename = fileURLToPath(new URL('./test.css', import.meta.url))
    const result = await transform(`
      @import "./fixtures/imported.css" screen and (max-width: 600px);
      @import "./fixtures/imported.css" supports(display: flex);
      @import url("https://example.com/font.css");
      @import "./fixtures/missing.css";
      @import "@missing/pkg/font.css";
      @import "magic-string";
      .foo {
        font-family: Poppins;
      }
    `, {}, cssFilename)
    expect(result).not.toContain('@font-face')
  })

  it('should ignore unsupported extensions', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockReset()
    await transform(`
      @font-face {
        font-family: 'Unique Font';
        src: url('./unsupported.wasm');
      }
    `, { resolvePath: id => new URL(id, import.meta.url) })
    expect(fromFile).not.toHaveBeenCalled()
  })

  it('should allow skipping font-face generation', async () => {
    const result = await transform(`
      @font-face {
        font-family: Poppins;
        src: url('poppins.ttf');
      }
    `, { skipFontFaceGeneration: () => true })
    expect(result).toBeUndefined()
  })

  it('should skip generating font face declarations for unsupported fallbacks', async () => {
    const result = await transform(`
      @font-face {
        font-family: Poppins;
        src: url('poppins.ttf');
      }
    `, { fallbacks: ['Bingle Bob the Unknown Font'] })
    expect(result).toBeUndefined()
  })

  it('should use specific fallbacks for different font families', async () => {
    expect(await transform(`
      @font-face {
        font-family: Poppins;
        src: url('poppins.ttf');
      }
      @font-face {
        font-family: 'JetBrains Mono';
        src: url('jetbrains-mono.ttf');
      }
    `, {
      fallbacks: {
        'Poppins': ['Helvetica Neue'],
        'JetBrains Mono': ['Courier New'],
      },
    }))
      .toMatchInlineSnapshot(`
        "@font-face {
          font-family: "Poppins fallback";
          src: local("Helvetica Neue");
          size-adjust: 111.1111%;
          ascent-override: 94.5%;
          descent-override: 31.5%;
          line-gap-override: 9%;
        }
        @font-face {
          font-family: Poppins;
          src: url('poppins.ttf');
        }
        @font-face {
          font-family: "JetBrains Mono fallback";
          src: local("Courier New");
          size-adjust: 99.9837%;
          ascent-override: 102.0166%;
          descent-override: 30.0049%;
          line-gap-override: 0%;
        }
        @font-face {
          font-family: 'JetBrains Mono';
          src: url('jetbrains-mono.ttf');
        }"
      `)
  })

  it('should handle font families not specified in fallbacks object by using category defaults', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockReset()
    // @ts-expect-error not typed as mock
    fromFile.mockResolvedValueOnce({
      familyName: 'UnknownFont',
      capHeight: 1000,
      ascent: 1000,
      descent: 200,
      lineGap: 0,
      unitsPerEm: 1000,
      xWidthAvg: 500,
      category: 'sans-serif',
    })

    const result = await transform(`
      @font-face {
        font-family: UnknownFont;
        src: url('unknownfont-category-defaults.ttf');
      }
    `, {
      fallbacks: {
        'Poppins': ['Helvetica Neue'],
        'JetBrains Mono': ['Courier New'],
      },
      resolvePath: id => new URL(id, import.meta.url),
    })

    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./unknownfont-category-defaults.ttf', import.meta.url)))
    expect(result).toContain('@font-face')
    expect(result).toContain('UnknownFont fallback')
  })

  describe('category-aware fallbacks', () => {
    it('should use serif preset for serif fonts', async () => {
      expect(await transform(`
        @font-face {
          font-family: Lora;
          src: url('lora.ttf');
        }
      `, {
        fallbacks: {},
      }))
        .toMatchInlineSnapshot(`
          "@font-face {
            font-family: "Lora fallback";
            src: local("Noto Serif");
            size-adjust: 97.2973%;
            ascent-override: 103.3944%;
            descent-override: 28.1611%;
            line-gap-override: 0%;
          }
          @font-face {
            font-family: "Lora fallback";
            src: local("Georgia");
            size-adjust: 104.9796%;
            ascent-override: 95.8281%;
            descent-override: 26.1003%;
            line-gap-override: 0%;
          }
          @font-face {
            font-family: "Lora fallback";
            src: local("Times New Roman");
            size-adjust: 115.2%;
            ascent-override: 87.3264%;
            descent-override: 23.7847%;
            line-gap-override: 0%;
          }
          @font-face {
              font-family: Lora;
              src: url('lora.ttf');
            }"
        `)
    })

    it('should use sans-serif preset for sans-serif fonts', async () => {
      expect(await transform(`
        @font-face {
          font-family: Poppins;
          src: url('poppins.ttf');
        }
      `, {
        fallbacks: {},
      }))
        .toMatchInlineSnapshot(`
          "@font-face {
            font-family: "Poppins fallback";
            src: local("Noto Sans");
            size-adjust: 105.4852%;
            ascent-override: 99.54%;
            descent-override: 33.18%;
            line-gap-override: 9.48%;
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
            font-family: "Poppins fallback";
            src: local("Helvetica Neue");
            size-adjust: 111.1111%;
            ascent-override: 94.5%;
            descent-override: 31.5%;
            line-gap-override: 9%;
          }
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
            src: local("BlinkMacSystemFont");
            size-adjust: 120.0469%;
            ascent-override: 87.4658%;
            descent-override: 29.1553%;
            line-gap-override: 8.3301%;
          }
          @font-face {
              font-family: Poppins;
              src: url('poppins.ttf');
            }"
        `)
    })

    it('should use monospace preset for monospace fonts', async () => {
      expect(await transform(`
        @font-face {
          font-family: 'JetBrains Mono';
          src: url('jetbrains-mono.ttf');
        }
      `, {
        fallbacks: {},
      }))
        .toMatchInlineSnapshot(`
          "@font-face {
            font-family: "JetBrains Mono fallback";
            src: local("Noto Sans Mono");
            size-adjust: 100%;
            ascent-override: 102%;
            descent-override: 30%;
            line-gap-override: 0%;
          }
          @font-face {
            font-family: "JetBrains Mono fallback";
            src: local("Roboto Mono");
            size-adjust: 99.9837%;
            ascent-override: 102.0166%;
            descent-override: 30.0049%;
            line-gap-override: 0%;
          }
          @font-face {
            font-family: "JetBrains Mono fallback";
            src: local("Courier New");
            size-adjust: 99.9837%;
            ascent-override: 102.0166%;
            descent-override: 30.0049%;
            line-gap-override: 0%;
          }
          @font-face {
              font-family: 'JetBrains Mono';
              src: url('jetbrains-mono.ttf');
            }"
        `)
    })

    it('should allow custom category fallback overrides', async () => {
      expect(await transform(`
        @font-face {
          font-family: Lora;
          src: url('lora.ttf');
        }
      `, {
        fallbacks: {},
        categoryFallbacks: {
          serif: ['Georgia'],
        },
      }))
        .toMatchInlineSnapshot(`
          "@font-face {
            font-family: "Lora fallback";
            src: local("Georgia");
            size-adjust: 104.9796%;
            ascent-override: 95.8281%;
            descent-override: 26.1003%;
            line-gap-override: 0%;
          }
          @font-face {
              font-family: Lora;
              src: url('lora.ttf');
            }"
        `)
    })

    it('should prioritize per-family overrides over category fallbacks', async () => {
      expect(await transform(`
        @font-face {
          font-family: Lora;
          src: url('lora.ttf');
        }
      `, {
        fallbacks: {
          Lora: ['Arial'],
        },
        categoryFallbacks: {
          serif: ['Georgia'],
        },
      }))
        .toMatchInlineSnapshot(`
          "@font-face {
            font-family: "Lora fallback";
            src: local("Arial");
            size-adjust: 104.9796%;
            ascent-override: 95.8281%;
            descent-override: 26.1003%;
            line-gap-override: 0%;
          }
          @font-face {
              font-family: Lora;
              src: url('lora.ttf');
            }"
        `)
    })

    it('should fall back to sans-serif preset when font has no category', async () => {
      // @ts-expect-error not typed as mock
      fromFile.mockReset()
      // @ts-expect-error not typed as mock
      fromFile.mockResolvedValueOnce({
        familyName: 'UnknownFont',
        capHeight: 1000,
        ascent: 1000,
        descent: 200,
        lineGap: 0,
        unitsPerEm: 1000,
        xWidthAvg: 500,
        // No category field
      })

      expect(await transform(`
        @font-face {
          font-family: UnknownFont;
          src: url('unknownfont-no-category.ttf');
        }
      `, {
        fallbacks: {},
        resolvePath: id => new URL(id, import.meta.url),
      }))
        .toMatchInlineSnapshot(`
          "@font-face {
            font-family: "UnknownFont fallback";
            src: local("Noto Sans");
            size-adjust: 105.4852%;
            ascent-override: 94.8%;
            descent-override: 18.96%;
            line-gap-override: 0%;
          }
          @font-face {
            font-family: "UnknownFont fallback";
            src: local("Arial");
            size-adjust: 112.1577%;
            ascent-override: 89.1602%;
            descent-override: 17.832%;
            line-gap-override: 0%;
          }
          @font-face {
            font-family: "UnknownFont fallback";
            src: local("Helvetica Neue");
            size-adjust: 111.1111%;
            ascent-override: 90%;
            descent-override: 18%;
            line-gap-override: 0%;
          }
          @font-face {
            font-family: "UnknownFont fallback";
            src: local("Segoe UI");
            size-adjust: 112.7753%;
            ascent-override: 88.6719%;
            descent-override: 17.7344%;
            line-gap-override: 0%;
          }
          @font-face {
            font-family: "UnknownFont fallback";
            src: local("BlinkMacSystemFont");
            size-adjust: 120.0469%;
            ascent-override: 83.3008%;
            descent-override: 16.6602%;
            line-gap-override: 0%;
          }
          @font-face {
              font-family: UnknownFont;
              src: url('unknownfont-no-category.ttf');
            }"
        `)
    })

    it('should respect legacy global fallbacks array', async () => {
      expect(await transform(`
        @font-face {
          font-family: Lora;
          src: url('lora.ttf');
        }
      `))
        .toMatchInlineSnapshot(`
          "@font-face {
            font-family: "Lora fallback";
            src: local("Segoe UI");
            size-adjust: 105.5577%;
            ascent-override: 95.3033%;
            descent-override: 25.9574%;
            line-gap-override: 0%;
          }
          @font-face {
            font-family: "Lora fallback";
            src: local("Arial");
            size-adjust: 104.9796%;
            ascent-override: 95.8281%;
            descent-override: 26.1003%;
            line-gap-override: 0%;
          }
          @font-face {
              font-family: Lora;
              src: url('lora.ttf');
            }"
        `)
    })
  })
})

async function transform(css: string, options: Partial<FontaineTransformOptions> = {}, filename = 'test.css') {
  const plugin = FontaineTransform.rollup({
    fallbacks: ['Arial', 'Segoe UI'],
    ...options,
  }) as RollupPlugin
  const result = await ((plugin.transform as any).handler)(css, filename)
  return result?.code.replace(/^ {6}/gm, '').trim()
}
