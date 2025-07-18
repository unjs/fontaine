import type { RollupPlugin } from 'unplugin'
import type { FontaineTransformOptions } from '../src/transform'
import { fileURLToPath } from 'node:url'
import { fromFile, fromUrl } from '@capsizecss/unpack'
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

  it('should handle font families not specified in fallbacks object', async () => {
    // Use a mock to ensure fromFile returns metrics for our test font
    // @ts-expect-error not typed as mock
    fromFile.mockResolvedValueOnce({
      familyName: 'UnknownFont',
      capHeight: 1000,
      ascent: 1000,
      descent: 200,
      lineGap: 0,
      unitsPerEm: 1000,
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

    expect(result).toBeUndefined()
  })
})

async function transform(css: string, options: Partial<FontaineTransformOptions> = {}, filename = 'test.css') {
  const plugin = FontaineTransform.rollup({
    fallbacks: ['Arial', 'Segoe UI'],
    ...options,
  }) as RollupPlugin
  const result = await (plugin.transform as any)(css, filename)
  return result?.code.replace(/^ {6}/gm, '').trim()
}
