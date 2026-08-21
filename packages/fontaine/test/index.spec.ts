import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { parse } from 'css-tree'
import { getRandomPort } from 'get-port-please'
import { dirname } from 'pathe'
import handler from 'serve-handler'
import { describe, expect, it } from 'vitest'
import { generateFallbackName, generateFontFace, parseFontFace } from '../src/css'
import { getMetricsForFamily, readMetrics } from '../src/metrics'

const fixtureURL = new URL('../playground/fonts/font.ttf', import.meta.url)

describe('generateFontFace', () => {
  it('generates CSS font face fallback ', async () => {
    const metrics = await readMetrics(fixtureURL)
    // @ts-expect-error if metrics is not defined the test should throw
    const result = generateFontFace(metrics, {
      'name': 'example fallback',
      'font': 'fallback',
      'font-weight': 'bold',
    })
    expect(result).toMatchInlineSnapshot(`
      "@font-face {
        font-family: "example fallback";
        src: local("fallback");
        size-adjust: 100%;
        ascent-override: 105%;
        descent-override: 35%;
        line-gap-override: 10%;
        font-weight: bold;
      }
      "
    `)
  })
})

describe('generateFallbackName', () => {
  it('works', () => {
    expect(generateFallbackName('some thing')).toBe('some thing fallback')
  })
})

describe('getMetricsForFamily', () => {
  it('reads font metrics based on font family', async () => {
    const metrics = await getMetricsForFamily('Merriweather Sans')
    expect(metrics).toMatchInlineSnapshot(`
      {
        "ascent": 1968,
        "category": "sans-serif",
        "descent": -546,
        "lineGap": 0,
        "unitsPerEm": 2000,
        "xWidthAvg": 949,
      }
    `)
    // Test cache
    expect(await getMetricsForFamily('Merriweather Sans')).toEqual(metrics)

    expect(

      generateFontFace(metrics!, {
        name: 'Merriweather Sans fallback',
        font: 'Arial',
        metrics: (await getMetricsForFamily('Arial'))!,
      }),
    ).toMatchInlineSnapshot(`
      "@font-face {
        font-family: "Merriweather Sans fallback";
        src: local("Arial");
        size-adjust: 106.4377%;
        ascent-override: 92.4485%;
        descent-override: 25.6488%;
        line-gap-override: 0%;
      }
      "
    `)
  })

  it('handles font families with more than one space in the name', async () => {
    const metrics = await getMetricsForFamily('IBM Plex Mono')
    expect(metrics).toMatchInlineSnapshot(`
      {
        "ascent": 1025,
        "category": "monospace",
        "descent": -275,
        "lineGap": 0,
        "unitsPerEm": 1000,
        "xWidthAvg": 600,
      }
    `)
    // Test cache
    expect(await getMetricsForFamily('IBM Plex Mono')).toEqual(metrics)

    expect(

      generateFontFace(metrics!, {
        name: 'IBM Plex Mono fallback',
        font: 'Arial',
        metrics: (await getMetricsForFamily('Arial'))!,
      }),
    ).toMatchInlineSnapshot(`
      "@font-face {
        font-family: "IBM Plex Mono fallback";
        src: local("Arial");
        size-adjust: 134.5893%;
        ascent-override: 76.1576%;
        descent-override: 20.4325%;
        line-gap-override: 0%;
      }
      "
    `)
  })

  it('handles non-existent metrics', async () => {
    const metrics = await getMetricsForFamily('Bingo Bob the Font')
    expect(metrics).toBeNull()
  })

  it('handles empty input', async () => {
    const metrics = await getMetricsForFamily('Bingo Bob the Font')
    expect(metrics).toBeNull()
  })
})

describe('readMetrics', () => {
  it('reads font metrics from a file', async () => {
    const metrics = await readMetrics(
      new URL('../playground/fonts/font.ttf', import.meta.url),
    )
    expect(metrics).toMatchInlineSnapshot(`
      {
        "ascent": 1050,
        "category": undefined,
        "descent": -350,
        "lineGap": 100,
        "unitsPerEm": 1000,
        "xWidthAvg": 500,
      }
    `)
  })
  it('reads metrics from a URL', async () => {
    const server = createServer((request, response) =>
      handler(request, response, {
        public: dirname(fileURLToPath(fixtureURL)),
      }),
    )
    const port = await getRandomPort()
    server.listen(port)
    const metrics = await readMetrics(`http://localhost:${port}/font.ttf`)
    expect(metrics).toMatchInlineSnapshot(`
      {
        "ascent": 1050,
        "category": undefined,
        "descent": -350,
        "lineGap": 100,
        "unitsPerEm": 1000,
        "xWidthAvg": 500,
      }
    `)
    server.close()
  })
  it('ignores non-URL paths', async () => {
    const metrics = await readMetrics(`/font.ttf`)
    expect(metrics).toBeNull()
  })
})

describe('parseFontFace', () => {
  it('should extract source, weight and font-family', () => {
    const [result] = parseFontFace(
      `@font-face {
        font-family: Roboto, "Arial Neue", sans-serif;
        src: url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2"),
             url("/fonts/OpenSans-Regular-webfont.woff") format("woff");
        unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB;
      }`,
    )
    expect(result).toMatchInlineSnapshot(`
      {
        "family": "Roboto",
        "index": 0,
        "properties": {},
        "source": "/fonts/OpenSans-Regular-webfont.woff2",
      }
    `)
  })

  it('should extract weight/style/stretch', () => {
    const [result] = parseFontFace(
      `@font-face {
        font-family: Roboto;
        font-weight: 700;
        font-style: italic;
        src: url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2");
        font-stretch: condensed;
      }`,
    )

    expect(result).toMatchInlineSnapshot(`
      {
        "family": "Roboto",
        "index": 0,
        "properties": {
          "font-stretch": "condensed",
          "font-style": "italic",
          "font-weight": "700",
        },
        "source": "/fonts/OpenSans-Regular-webfont.woff2",
      }
    `)
  })

  it('should handle invalid weight/style/stretch', () => {
    const [result] = parseFontFace(
      `@font-face {
        font-family: Roboto;
        font-weight;
        font-style;
        src: url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2");
        font-stretch;
      }`,
    )

    expect(result).toMatchInlineSnapshot(`
      {
        "family": "Roboto",
        "index": 0,
        "properties": {},
        "source": "/fonts/OpenSans-Regular-webfont.woff2",
      }
    `)
  })

  it('should not extract incomplete font-faces', () => {
    expect(parseFontFace(`@font-face {}`)).toStrictEqual([])
    expect(parseFontFace(
      `@font-face {
        font-family: 'Something'
        src: url("") format("woff"), url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2");
      }`,
    )).toStrictEqual([])
  })

  it('should handle sources with parentheses', () => {
    expect(parseFontFace(
      `@font-face {
        font-family: 'Inter';
        font-display: swap;

        src: url('./node_modules/inter-ui/Inter (web)/Inter-Regular.woff2')
          format('woff2');
      }`,
    )).toMatchInlineSnapshot(`
      [
        {
          "family": "Inter",
          "index": 0,
          "properties": {},
          "source": "./node_modules/inter-ui/Inter (web)/Inter-Regular.woff2",
        },
      ]
    `)
  })

  it('should handle css without font-face', () => {
    expect(parseFontFace(`@media {}`)).toStrictEqual([])
  })

  it('should support being passed the ast', () => {
    const ast = parse(`@font-face {
      font-family: "Arial";
      src: local("Arial") url();
    }`, { positions: true })
    expect(parseFontFace(ast)).toMatchInlineSnapshot(`
      [
        {
          "family": "Arial",
          "index": 0,
          "properties": {},
        },
      ]
    `)
  })

  it('should handle sources without urls', () => {
    expect(parseFontFace(
      `@font-face {
        font-family: "Arial";
        src: local("Arial") url();
      }`,
    )).toMatchInlineSnapshot(`
      [
        {
          "family": "Arial",
          "index": 0,
          "properties": {},
        },
      ]
    `)
  })
})
