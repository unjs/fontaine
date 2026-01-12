import type { RollupPlugin } from 'unplugin'
import type { FontaineTransformOptions } from '../src/transform'
import { fileURLToPath } from 'node:url'
import { fromUrl } from '@capsizecss/unpack'
import { fromFile } from '@capsizecss/unpack/fs'
import { describe, expect, it, vi } from 'vitest'
import { FontaineTransform } from '../src'

vi.mock('@capsizecss/unpack', { spy: true })

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
    await transform(`
      @font-face {
        font-family: 'Unique Font';
        src: url('./my.ttf');
      }
    `, { resolvePath: id => new URL(id, import.meta.url) })
    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./my.ttf', import.meta.url)))

    // @ts-expect-error not typed as mock
    fromFile.mockReset()
    const cssFilename = fileURLToPath(new URL('./test.css', import.meta.url))
    await transform(`
      @font-face {
        font-family: 'Unique Font';
        src: url('./my.ttf');
      }
    `, {}, cssFilename)
    expect(fromFile).toHaveBeenCalledWith(fileURLToPath(new URL('./my.ttf', import.meta.url)))
  })

  it('should ignore unsupported extensions', async () => {
    // @ts-expect-error not typed as mock
    fromFile.mockReset()
    await transform(`
      @font-face {
        font-family: 'Unique Font';
        src: url('./my.wasm');
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
    // Use a mock to ensure fromFile returns metrics for our test font
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
        src: url('unknownfont.ttf');
      }
    `, {
      fallbacks: {
        'Poppins': ['Helvetica Neue'],
        'JetBrains Mono': ['Courier New'],
      },
      resolvePath: id => new URL(id, import.meta.url),
    })

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
          src: url('unknownfont.ttf');
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
              src: url('unknownfont.ttf');
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
