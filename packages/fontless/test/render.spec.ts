import { describe, expect, it } from 'vitest'

import { generateFontFace, generateFontFallbacks, parseFont, relativiseFontSources } from '../src/css/render'

describe('rendering @font-face', () => {
  it('should add declarations for `font-family`', () => {
    const css = generateFontFace('Inter', {
      src: [{ name: 'Inter Var' }, { url: '/inter.woff2' }],
      weight: [400, 700],
    })
    expect(css).toMatchInlineSnapshot(`
      "@font-face {
        font-family: 'Inter';
        src: local("Inter Var"), url("/inter.woff2");
        font-display: swap;
        font-weight: 400 700;
      }"
    `)
  })
  it('should support additional properties', () => {
    const css = generateFontFace('Helvetica Neue', {
      src: [{ url: '/helvetica-neue.woff2' }],
      stretch: 'expanded',
      display: 'fallback',
      style: 'italic',
      weight: '400',
    })
    expect(css).toMatchInlineSnapshot(`
      "@font-face {
        font-family: 'Helvetica Neue';
        src: url("/helvetica-neue.woff2");
        font-display: fallback;
        font-weight: 400;
        font-style: italic;
        font-stretch: expanded;
      }"
    `)
  })
  it('should omit `format()` when the format is unknown', () => {
    // `parseFont` leaves `format` undefined when the extension is not recognised,
    // which covers cache-busted and extensionless provider URLs
    const css = generateFontFace('Inter', {
      src: [parseFont('/inter.woff2?v=3.19') as never, parseFont('https://fonts.example.com/l/font?kit=abc') as never],
    })
    expect(css).toMatchInlineSnapshot(`
      "@font-face {
        font-family: 'Inter';
        src: url("/inter.woff2?v=3.19"), url("https://fonts.example.com/l/font?kit=abc");
        font-display: swap;
      }"
    `)
  })
  it('should quote `format()` values that are not keywords', () => {
    const css = generateFontFace('Inter', {
      src: [{ url: '/inter.woff2', format: 'woff2-variations' }],
    })
    expect(css).toMatchInlineSnapshot(`
      "@font-face {
        font-family: 'Inter';
        src: url("/inter.woff2") format("woff2-variations");
        font-display: swap;
      }"
    `)
  })
  it('should render metric override descriptors', () => {
    const css = generateFontFace('Inter', {
      src: [{ url: '/inter.woff2' }],
      ascentOverride: '90%',
      descentOverride: '20%',
      lineGapOverride: '0%',
      sizeAdjust: '105%',
    })
    expect(css).toMatchInlineSnapshot(`
      "@font-face {
        font-family: 'Inter';
        src: url("/inter.woff2");
        font-display: swap;
        ascent-override: 90%;
        descent-override: 20%;
        line-gap-override: 0%;
        size-adjust: 105%;
      }"
    `)
  })
  it('should render feature and variation settings', () => {
    const css = generateFontFace('Inter', {
      src: [{ url: '/inter.woff2' }],
      featureSettings: '"cv11" 1',
      variationSettings: '"opsz" 32',
    })
    expect(css).toContain('font-feature-settings: "cv11" 1;')
    expect(css).toContain('font-variation-settings: "opsz" 32;')
  })
  it('should render `tech()` as an unquoted keyword', () => {
    const css = generateFontFace('Trickster', {
      src: [{ url: '/trickster.otf', format: 'opentype', tech: 'color-COLRv1' }],
    })
    expect(css).toMatchInlineSnapshot(`
      "@font-face {
        font-family: 'Trickster';
        src: url("/trickster.otf") format(opentype) tech(color-COLRv1);
        font-display: swap;
      }"
    `)
  })
})

describe('generateFontFallbacks', () => {
  it('should generate a fallback face for a family without known metrics', async () => {
    const [css] = await generateFontFallbacks('Inter', { src: [{ url: '/inter.woff2' }] }, [
      { name: 'Inter Fallback: Some Unknown Font', font: 'Some Unknown Font' },
    ])

    expect(css).toContain('font-family: "Inter Fallback: Some Unknown Font"')
    expect(css).toContain('local("Some Unknown Font")')
  })

  it('should generate no fallbacks when none are requested', async () => {
    expect(await generateFontFallbacks('Inter', { src: [{ url: '/inter.woff2' }] })).toEqual([])
  })

  it('should use metrics reported by the provider', async () => {
    const [css] = await generateFontFallbacks('Some Unresolvable Font', {
      src: [{ url: '/unreadable.woff2' }],
      metrics: { unitsPerEm: 1000, ascent: 1000, descent: -250, lineGap: 0, xWidthAvg: 500 },
    } as never, [
      { name: 'Some Unresolvable Font Fallback: Arial', font: 'Arial' },
    ])

    expect(css).toContain('font-family: "Some Unresolvable Font Fallback: Arial"')
    expect(css).toContain('ascent-override: 89.1602%')
    expect(css).toContain('descent-override: 22.29%')
    expect(css).toContain('size-adjust: 112.1577%')
  })

  it('should leave `size-adjust` alone when the provider reports no average width', async () => {
    const [css] = await generateFontFallbacks('Some Unresolvable Font', {
      src: [{ url: '/unreadable.woff2' }],
      metrics: { unitsPerEm: 1000, ascent: 1000, descent: -250, lineGap: 0 },
    } as never, [
      { name: 'Some Unresolvable Font Fallback: Arial', font: 'Arial' },
    ])

    expect(css).toContain('size-adjust: 100%')
    expect(css).toContain('ascent-override: 100%')
  })

  it('should complete partial provider metrics from the metrics database', async () => {
    const [ascentFromProvider] = await generateFontFallbacks('Inter', {
      src: [{ url: '/unreadable.woff2' }],
      metrics: { unitsPerEm: 2000, ascent: 2000 },
    } as never, [
      { name: 'Inter Fallback: Arial', font: 'Arial' },
    ])

    expect(ascentFromProvider).toContain('ascent-override: 93.3538%')
    expect(ascentFromProvider).toContain('descent-override: 22.518%')

    const [descentFromProvider] = await generateFontFallbacks('Inter', {
      src: [{ url: '/unreadable.woff2' }],
      metrics: { unitsPerEm: 2000, descent: -500 },
    } as never, [
      { name: 'Inter Fallback: Arial', font: 'Arial' },
    ])

    expect(descentFromProvider).toContain('descent-override: 23.3384%')
  })

  it('should ignore provider metrics that cannot produce fallback descriptors', async () => {
    for (const metrics of [
      null,
      'nope',
      {},
      { unitsPerEm: 0, ascent: 1000, descent: -250, lineGap: 0 },
      { unitsPerEm: 1000, ascent: 1000, capHeight: 700, xHeight: 500 },
    ]) {
      expect(await generateFontFallbacks('Some Unresolvable Font', { src: [{ url: '/unreadable.woff2' }], metrics } as never, [
        { name: 'Some Unresolvable Font Fallback: Arial', font: 'Arial' },
      ])).toEqual([])
    }
  })
})

describe('relativiseFontSources', () => {
  it('should rewrite root-relative URLs relative to the stylesheet', () => {
    const font = relativiseFontSources({ src: [{ url: '/assets/_fonts/inter.woff2' }] }, '/css')

    expect(font.src).toEqual([{ url: '../assets/_fonts/inter.woff2' }])
  })

  it('should leave local and already-relative sources untouched', () => {
    const src = [{ name: 'Inter Var' }, { url: './inter.woff2' }, { url: 'https://cdn.example.com/inter.woff2' }]

    expect(relativiseFontSources({ src }, '/css').src).toEqual(src)
  })
})
