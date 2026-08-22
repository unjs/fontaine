import { describe, expect, it } from 'vitest'

import { generateFontFace, parseFont, relativiseFontSources } from '../src/css/render'

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
