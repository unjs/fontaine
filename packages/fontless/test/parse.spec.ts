import { parse, walk } from 'css-tree'
import { describe, expect, it } from 'vitest'

import { transformCSS } from '../src'
import { extractFontFamilies } from '../src/css/parse'

describe('parsing', () => {
  it('should add declarations for `font-family`', async () => {
    expect(await transform(`:root { font-family: 'CustomFont' }`))
      .toMatchInlineSnapshot(`
        "@font-face {
          font-family: 'CustomFont';
          src: url("/customfont.woff2") format(woff2);
          font-display: swap;
        }
        :root { font-family: 'CustomFont' }"
      `)
  })

  it('should add declarations after any @import', async () => {
    expect(await transform(`@import url("https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css") layer(bootstrap); body { font-family: "Gabarito", sans-serif; }`))
      .toMatchInlineSnapshot(`
        "@import url("https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css") layer(bootstrap);
        @font-face {
          font-family: 'Gabarito';
          src: url("/gabarito.woff2") format(woff2);
          font-display: swap;
        }
        @font-face {
          font-family: "Gabarito Fallback: Times New Roman";
          src: local("Times New Roman");
          size-adjust: 108.8%;
          ascent-override: 86.3971%;
          descent-override: 23.8971%;
          line-gap-override: 0%;
        }

         body { font-family: "Gabarito", "Gabarito Fallback: Times New Roman", sans-serif; }"
      `)
  })

  it('should add declarations after multiple @import and @charset', async () => {
    expect(await transform(`@charset "UTF-8";
@import url("reset.css");
@import url("typography.css");
@namespace url("http://www.w3.org/1999/xhtml");
body { font-family: "Inter", sans-serif; }`))
      .toMatchInlineSnapshot(`
        "@charset "UTF-8";
        @import url("reset.css");
        @import url("typography.css");
        @namespace url("http://www.w3.org/1999/xhtml");
        @font-face {
          font-family: 'Inter';
          src: url("/inter.woff2") format(woff2);
          font-display: swap;
        }
        @font-face {
          font-family: "Inter Fallback: Times New Roman";
          src: local("Times New Roman");
          size-adjust: 117.5481%;
          ascent-override: 82.4131%;
          descent-override: 20.5202%;
          line-gap-override: 0%;
        }


        body { font-family: "Inter", "Inter Fallback: Times New Roman", sans-serif; }"
      `)
  })

  it('should add declarations for `font`', async () => {
    expect(await transform(`:root { font: 1.2em 'CustomFont' }`))
      .toMatchInlineSnapshot(`
        "@font-face {
          font-family: 'CustomFont';
          src: url("/customfont.woff2") format(woff2);
          font-display: swap;
        }
        :root { font: 1.2em 'CustomFont' }"
      `)
  })

  it('should add declarations for `font-family` with CSS variables', async () => {
    expect(await transform(`:root { --custom-css-variable: 'CustomFont' }`))
      .toMatchInlineSnapshot(`
        "@font-face {
          font-family: 'CustomFont';
          src: url("/customfont.woff2") format(woff2);
          font-display: swap;
        }
        :root { --custom-css-variable: 'CustomFont' }"
      `)
  })

  it('should handle multi word and unquoted font families', async () => {
    expect(await transform(`
    :root { font-family:Open Sans}
    :root { font-family: Open Sans, sans-serif }
    :root { --test1: Open Sans }
    :root { --test2: Open Sans, sans-serif }
    :root { --test3: "Open Sans" }
    :root { --test4: "Open Sans", sans-serif }
    `))
      .toMatchInlineSnapshot(`
        "@font-face {
          font-family: 'Open Sans';
          src: url("/open-sans.woff2") format(woff2);
          font-display: swap;
        }
        @font-face {
          font-family: "Open Sans Fallback: Times New Roman";
          src: local("Times New Roman");
          size-adjust: 115.3846%;
          ascent-override: 92.6335%;
          descent-override: 25.3906%;
          line-gap-override: 0%;
        }


            :root { font-family:Open Sans, "Open Sans Fallback: Times New Roman"}
            :root { font-family: Open Sans, "Open Sans Fallback: Times New Roman", sans-serif }
            :root { --test1: Open Sans , "Open Sans Fallback: Times New Roman"}
            :root { --test2: Open Sans, "Open Sans Fallback: Times New Roman", sans-serif }
            :root { --test3: "Open Sans" , "Open Sans Fallback: Times New Roman"}
            :root { --test4: "Open Sans", "Open Sans Fallback: Times New Roman", sans-serif }
            "
      `)
  })
  it('should ignore any @font-face already in scope', async () => {
    expect(await transform([
      `@font-face { font-family: 'ScopedFont'; src: local("ScopedFont") }`,
      `:root { font-family: 'ScopedFont' }`,
      `:root { font-family: 'CustomFont' }`,
    ].join('\n')))
      .toMatchInlineSnapshot(`
        "@font-face {
          font-family: 'CustomFont';
          src: url("/customfont.woff2") format(woff2);
          font-display: swap;
        }
        @font-face { font-family: 'ScopedFont'; src: local("ScopedFont") }
        :root { font-family: 'ScopedFont' }
        :root { font-family: 'CustomFont' }"
      `)
  })

  it('should not insert font fallbacks if metrics cannot be resolved', async () => {
    expect(await transform(`:root { font-family: 'CustomFont', "OtherFont", sans-serif }`))
      .toMatchInlineSnapshot(`
        "@font-face {
          font-family: 'CustomFont';
          src: url("/customfont.woff2") format(woff2);
          font-display: swap;
        }
        :root { font-family: 'CustomFont', "OtherFont", sans-serif }"
      `)
  })

  it('should add `@font-face` declarations with metrics', async () => {
    expect(await transform(`:root { font-family: 'Poppins', 'Arial', sans-serif }`))
      .toMatchInlineSnapshot(`
        "@font-face {
          font-family: 'Poppins';
          src: url("/poppins.woff2") format(woff2);
          font-display: swap;
        }
        @font-face {
          font-family: "Poppins Fallback: Times New Roman";
          src: local("Times New Roman");
          size-adjust: 123.0769%;
          ascent-override: 85.3125%;
          descent-override: 28.4375%;
          line-gap-override: 8.125%;
        }

        @font-face {
          font-family: "Poppins Fallback: Arial";
          src: local("Arial");
          size-adjust: 112.1577%;
          ascent-override: 93.6182%;
          descent-override: 31.2061%;
          line-gap-override: 8.916%;
        }

        :root { font-family: 'Poppins', "Poppins Fallback: Times New Roman", "Poppins Fallback: Arial", 'Arial', sans-serif }"
      `)
  })
})

describe('parsing css', () => {
  it('should handle multi-word and unquoted font families', async () => {
    for (const family of ['\'Press Start 2P\'', 'Press Start 2P']) {
      const ast = parse(`:root { font-family: ${family} }`, { positions: true })

      const extracted = new Set<string>()
      walk(ast, {
        visit: 'Declaration',
        enter(node) {
          if (node.property === 'font-family') {
            for (const family of extractFontFamilies(node)) {
              extracted.add(family)
            }
          }
        },
      })
      expect([...extracted]).toEqual(['Press Start 2P'])
    }
  })

  it('should handle nested CSS', async () => {
    const expected = await transform(`.parent { div { font-family: 'Poppins'; } p { font-family: 'Poppins'; @media (min-width: 768px) { @media (prefers-reduced-motion: reduce) { a { font-family: 'Lato'; } } } } }`)
    expect(expected).toMatchInlineSnapshot(`
      "@font-face {
        font-family: 'Lato';
        src: url("/lato.woff2") format(woff2);
        font-display: swap;
      }
      @font-face {
        font-family: "Lato Fallback: Times New Roman";
        src: local("Times New Roman");
        size-adjust: 107.2%;
        ascent-override: 92.0709%;
        descent-override: 19.8694%;
        line-gap-override: 0%;
      }

      @font-face {
        font-family: 'Poppins';
        src: url("/poppins.woff2") format(woff2);
        font-display: swap;
      }
      @font-face {
        font-family: "Poppins Fallback: Times New Roman";
        src: local("Times New Roman");
        size-adjust: 123.0769%;
        ascent-override: 85.3125%;
        descent-override: 28.4375%;
        line-gap-override: 8.125%;
      }

      .parent { div { font-family: 'Poppins', "Poppins Fallback: Times New Roman"; } p { font-family: 'Poppins', "Poppins Fallback: Times New Roman"; @media (min-width: 768px) { @media (prefers-reduced-motion: reduce) { a { font-family: 'Lato', "Lato Fallback: Times New Roman"; } } } } }"
      `)
  })
})

const slugify = (str: string) => str.toLowerCase().replace(/\W/g, '-')

describe('lightningcss integration', () => {
  it('should transform CSS with lightningcss in production mode', async () => {
    const result = await transformLightningCSS(`:root { font-family: 'Poppins' }`)
    expect(result).toMatchInlineSnapshot(`"@font-face{font-family:Poppins;src:url(/poppins.woff2)format("woff2");font-display:swap}@font-face{font-family:Poppins Fallback\\: Times New Roman;src:local(Times New Roman);size-adjust:123.077%;ascent-override:85.3125%;descent-override:28.4375%;line-gap-override:8.125%}:root { font-family: 'Poppins', "Poppins Fallback: Times New Roman" }"`)
  })

  it('should handle multiple font families with lightningcss', async () => {
    const result = await transformLightningCSS(`:root { font-family: 'Inter', 'Arial', sans-serif }`)
    expect(result).toMatchInlineSnapshot(`"@font-face{font-family:Inter;src:url(/inter.woff2)format("woff2");font-display:swap}@font-face{font-family:Inter Fallback\\: Times New Roman;src:local(Times New Roman);size-adjust:117.548%;ascent-override:82.4131%;descent-override:20.5202%;line-gap-override:0%}@font-face{font-family:Inter Fallback\\: Arial;src:local(Arial);size-adjust:107.119%;ascent-override:90.4365%;descent-override:22.518%;line-gap-override:0%}:root { font-family: 'Inter', "Inter Fallback: Times New Roman", "Inter Fallback: Arial", 'Arial', sans-serif }"`)
  })

  it('should preserve import rules with lightningcss', async () => {
    const result = await transformLightningCSS(`@import url("reset.css"); body { font-family: "Lato"; }`)
    expect(result).toMatchInlineSnapshot(`
      "@import url("reset.css");
      @font-face{font-family:Lato;src:url(/lato.woff2)format("woff2");font-display:swap}@font-face{font-family:Lato Fallback\\: Times New Roman;src:local(Times New Roman);size-adjust:107.2%;ascent-override:92.0709%;descent-override:19.8694%;line-gap-override:0%} body { font-family: "Lato", "Lato Fallback: Times New Roman"; }"
    `)
  })

  it('should handle font shorthand with lightningcss', async () => {
    const result = await transformLightningCSS(`:root { font: 16px/1.4 'Roboto' }`)
    expect(result).toMatchInlineSnapshot(`"@font-face{font-family:Roboto;src:url(/roboto.woff2)format("woff2");font-display:swap}@font-face{font-family:Roboto Fallback\\: Times New Roman;src:local(Times New Roman);size-adjust:109.495%;ascent-override:84.7283%;descent-override:22.2969%;line-gap-override:0%}:root { font: 16px/1.4 'Roboto', "Roboto Fallback: Times New Roman" }"`)
  })

  it('should work in development mode with lightningcss options', async () => {
    const result = await transformCSS({
      dev: true,
      processCSSVariables: true,
      shouldPreload: () => true,
      fontsToPreload: new Map(),
      lightningcssOptions: { minify: false },
      resolveFontFace: (family, options) => ({
        fonts: [{ src: [{ url: `/${slugify(family)}.woff2`, format: 'woff2' }] }],
        fallbacks: options?.fallbacks ? ['Times New Roman', ...options.fallbacks] : undefined,
      }),
    }, `:root { font-family: 'CustomFont' }`, 'some-id')

    expect(result?.toString()).toMatchInlineSnapshot(`
      "@font-face {
        font-family: 'CustomFont';
        src: url("/customfont.woff2") format(woff2);
        font-display: swap;
      }
      :root { font-family: 'CustomFont' }"
    `)
  })
})

async function transform(css: string) {
  const result = await transformCSS({
    dev: true,
    processCSSVariables: true,
    shouldPreload: () => true,
    fontsToPreload: new Map(),
    resolveFontFace: (family, options) => ({
      fonts: [{ src: [{ url: `/${slugify(family)}.woff2`, format: 'woff2' }] }],
      fallbacks: options?.fallbacks ? ['Times New Roman', ...options.fallbacks] : undefined,
    }),
  }, css, 'some-id')
  return result?.toString()
}

async function transformLightningCSS(css: string) {
  const result = await transformCSS({
    dev: false,
    processCSSVariables: true,
    shouldPreload: () => true,
    fontsToPreload: new Map(),
    lightningcssOptions: { minify: true },
    resolveFontFace: (family, options) => ({
      fonts: [{ src: [{ url: `/${slugify(family)}.woff2`, format: 'woff2' }] }],
      fallbacks: options?.fallbacks ? ['Times New Roman', ...options.fallbacks] : undefined,
    }),
  }, css, 'some-id')
  return result?.toString()
}
