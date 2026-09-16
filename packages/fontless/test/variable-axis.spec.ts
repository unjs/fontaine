import type { FontFaceData, InitializedProvider, Provider, ProviderContext, ResolveFontResult } from 'unifont'
import type { NormalizeFontDataContext, NormalizeFontDataOptions, RenderedFont } from '../src/assets'
import type { FontFamilyProviderOverride, FontlessOptions, ResolvedVariableAxisOptions, VariableAxisOptions } from '../src/types'
import { Buffer } from 'node:buffer'
import { promises as fsp } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { normalizeFontData } from '../src/assets'
import { createResolver } from '../src/resolve'
import { normalizeAxisValues, resolveVariationAxes, subsetFontData, unicodeRangeToText, withoutVariationSettings } from '../src/subset'

const fixture = fileURLToPath(new URL('fixtures/font.woff2', import.meta.url))

function createContext(): NormalizeFontDataContext {
  return {
    dev: false,
    renderedFontURLs: new Map<string, RenderedFont>(),
    assetsBaseURL: '/assets/_fonts',
  }
}

function renderFace(face: Partial<FontFaceData>, options: NormalizeFontDataOptions = {}) {
  const context = createContext()
  const [rendered] = normalizeFontData(context, [{
    src: [{ url: 'https://fonts.example.com/font.woff2', format: 'woff2' }],
    ...face,
  }], options)
  return { face: rendered!, emitted: [...context.renderedFontURLs.entries()][0]! }
}

describe('resolveVariationAxes', () => {
  it('should pin an axis `unifont` applied as a descriptor', () => {
    expect(resolveVariationAxes({ CASL: { values: ['1'], appliedAs: 'variation-settings' } }))
      .toEqual({ axes: { CASL: 1 }, pinned: ['CASL'] })
  })

  it('should leave an axis the provider instanced itself alone', () => {
    expect(resolveVariationAxes({ CASL: { values: ['1'], appliedAs: 'font-file' } })).toBeUndefined()
  })

  it('should apply an axis nothing has applied yet, keeping the CSS as it is', () => {
    expect(resolveVariationAxes({ MONO: { values: [['0', '1']], appliedAs: 'none' } }))
      .toEqual({ axes: { MONO: { min: 0, max: 1 } }, pinned: [] })
  })

  it('should leave axes expressed by `@font-face` descriptors alone', () => {
    expect(resolveVariationAxes({
      wght: { values: ['700'], appliedAs: 'none' },
      ital: { values: ['1'], appliedAs: 'none' },
    })).toBeUndefined()
  })

  it('should leave multi-value and non-numeric axes alone', () => {
    expect(resolveVariationAxes({ CASL: { values: ['0', '1'], appliedAs: 'none' } })).toBeUndefined()
    expect(resolveVariationAxes({ CASL: { values: ['casual'], appliedAs: 'variation-settings' } })).toBeUndefined()
    expect(resolveVariationAxes({ MONO: { values: [['casual', '1']], appliedAs: 'none' } })).toBeUndefined()
    expect(resolveVariationAxes({ MONO: { values: [['0', 'mono']], appliedAs: 'none' } })).toBeUndefined()
  })

  it('should apply nothing when there is no resolution to act on', () => {
    expect(resolveVariationAxes({})).toBeUndefined()
  })
})

describe('normalizeAxisValues', () => {
  it('should express numbers, tuples and objects the way unifont reports them', () => {
    expect(normalizeAxisValues({ CASL: [1], MONO: [[0, 1]], slnt: [{ min: -15, max: 0 }] })).toEqual({
      CASL: { values: ['1'], appliedAs: 'none' },
      MONO: { values: [['0', '1']], appliedAs: 'none' },
      slnt: { values: [['-15', '0']], appliedAs: 'none' },
    })
  })

  it('should drop axes with no requested values', () => {
    expect(normalizeAxisValues({ CASL: [] })).toEqual({})
  })
})

describe('withoutVariationSettings', () => {
  it('should keep the tags it was not asked to remove', () => {
    expect(withoutVariationSettings('"CASL" 1, "MONO" 0', ['CASL'])).toBe('"MONO" 0')
    expect(withoutVariationSettings('"CASL" 1, "MONO" 0, "slnt" -15', ['CASL', 'slnt'])).toBe('"MONO" 0')
  })

  it('should keep an entry it cannot read', () => {
    expect(withoutVariationSettings('"CASL" 1, nonsense', ['CASL'])).toBe('nonsense')
  })

  it('should return nothing when no tags remain', () => {
    expect(withoutVariationSettings('"CASL" 1', ['CASL'])).toBeUndefined()
    expect(withoutVariationSettings(undefined, ['CASL'])).toBeUndefined()
  })
})

describe('unicodeRangeToText', () => {
  it('should expand ranges, single codepoints and wildcards', () => {
    expect(unicodeRangeToText(['U+0041-0043', 'U+0061'])).toBe('ABCa')
    expect(unicodeRangeToText(['U+002?'])).toBe(' !"#$%&\'()*+,-./')
  })

  it('should return nothing for a range too large to expand', () => {
    expect(unicodeRangeToText(['U+0-10FFFF'])).toBeUndefined()
    expect(unicodeRangeToText(['U+0041-0043', 'U+0-10FFFF'])).toBeUndefined()
  })

  it('should return nothing for a range it cannot read', () => {
    expect(unicodeRangeToText()).toBeUndefined()
    expect(unicodeRangeToText([])).toBeUndefined()
    expect(unicodeRangeToText([''])).toBeUndefined()
    expect(unicodeRangeToText(['U+'])).toBeUndefined()
    expect(unicodeRangeToText(['nonsense'])).toBeUndefined()
    expect(unicodeRangeToText(['U+0043-0041'])).toBeUndefined()
  })

  it('should require a complete entry rather than reading what it can', () => {
    expect(unicodeRangeToText(['0041'])).toBeUndefined()
    expect(unicodeRangeToText(['U+0041junk'])).toBeUndefined()
    expect(unicodeRangeToText(['U+0041-'])).toBeUndefined()
    expect(unicodeRangeToText(['U+00 41'])).toBeUndefined()
    expect(unicodeRangeToText(['U+00000??'])).toBeUndefined()
  })

  it('should expand a wildcard entry of up to six positions', () => {
    expect(unicodeRangeToText(['U+00004?'])).toHaveLength(16)
    expect(unicodeRangeToText(['U+0000??'])).toHaveLength(256)
  })

  it('should return nothing for a codepoint outside Unicode', () => {
    expect(unicodeRangeToText(['U+110000'])).toBeUndefined()
    expect(unicodeRangeToText(['U+0041-110000'])).toBeUndefined()
    expect(unicodeRangeToText(['U+??????'])).toBeUndefined()
    expect(unicodeRangeToText(['U+10FFFF'])).toBe('\u{10FFFF}')
  })
})

describe('variable axis instancing', () => {
  it('should instance a font it can subset, dropping the axis from the CSS', () => {
    const { face, emitted } = renderFace({ variationSettings: '"CASL" 1, "MONO" 0' }, {
      glyphs: 'Hand',
      variableAxis: { CASL: { values: ['1'], appliedAs: 'variation-settings' } },
    })

    expect(emitted[1].variationAxes).toEqual({ CASL: 1 })
    expect(emitted[1].subset).toBe('Hand')
    expect(face.variationSettings).toBe('"MONO" 0')
  })

  it('should narrow an axis nothing has applied yet, keeping the CSS as it is', () => {
    const { face, emitted } = renderFace({ unicodeRange: ['U+0041'] }, {
      variableAxis: { MONO: { values: [['0', '1']], appliedAs: 'none' } },
    })

    expect(emitted[1].variationAxes).toEqual({ MONO: { min: 0, max: 1 } })
    expect(face.variationSettings).toBeUndefined()
  })

  it('should leave the font alone when the provider instanced it already', () => {
    const { face, emitted } = renderFace({ unicodeRange: ['U+0041'] }, {
      variableAxis: { CASL: { values: ['1'], appliedAs: 'font-file' } },
    })

    expect(emitted[1].variationAxes).toBeUndefined()
    expect(emitted[1].subset).toBeUndefined()
    expect(face.variationSettings).toBeUndefined()
  })

  it('should derive the glyphs to subset to from the face\'s unicode range', () => {
    const { emitted } = renderFace({ unicodeRange: ['U+0041-0042'], variationSettings: '"CASL" 1' }, {
      variableAxis: { CASL: { values: ['1'], appliedAs: 'variation-settings' } },
    })

    expect(emitted[1].subset).toBe('AB')
    expect(emitted[1].variationAxes).toEqual({ CASL: 1 })
  })

  it('should leave the font and CSS alone when there are no glyphs to subset to', () => {
    const { face, emitted } = renderFace({ variationSettings: '"CASL" 1' }, {
      variableAxis: { CASL: { values: ['1'], appliedAs: 'variation-settings' } },
    })

    expect(emitted[1].subset).toBeUndefined()
    expect(emitted[1].variationAxes).toBeUndefined()
    expect(face.variationSettings).toBe('"CASL" 1')
  })

  it('should emit one file per set of axis values for the same source font', () => {
    const context = createContext()
    const face = () => ({ src: [{ url: 'https://fonts.example.com/font.woff2', format: 'woff2' }], unicodeRange: ['U+0041'], variationSettings: '"CASL" 1' })
    normalizeFontData(context, [face()], { variableAxis: { CASL: { values: ['1'], appliedAs: 'variation-settings' } } })
    normalizeFontData(context, [face()], { variableAxis: { CASL: { values: ['0'], appliedAs: 'variation-settings' } } })
    normalizeFontData(context, [face()])

    expect(context.renderedFontURLs.size).toBe(3)
  })
})

describe('subsetFontData with variation axes', () => {
  it('should keep the glyph subset when the font does not have the axis', async () => {
    const font = await fsp.readFile(fixture)
    const subset = await subsetFontData(font, 'Hand', fixture)
    const pinned = await subsetFontData(font, 'Hand', fixture, { CASL: 1 })
    const narrowed = await subsetFontData(font, 'Hand', fixture, { MONO: { min: 0, max: 1 } })

    expect(subset).not.toEqual(font)
    expect(pinned).toEqual(subset)
    expect(narrowed).toEqual(subset)
  })

  it('should subset as usual when no axes are requested', async () => {
    const font = Buffer.from(await fsp.readFile(fixture))

    expect(await subsetFontData(font, 'Hand', fixture, {})).not.toEqual(font)
  })
})

describe('variableAxis option', () => {
  function createTrackingProvider(name: string, result?: Partial<ResolveFontResult>) {
    const calls: Array<{ family: string, options: unknown }> = []
    const provider = () => {
      const resolveFont: InitializedProvider['resolveFont'] = async (family, options) => {
        calls.push({ family, options })
        return { fonts: [{ src: [{ url: '/font.woff2', format: 'woff2' }] }], ...result }
      }
      return Object.assign((_ctx: ProviderContext) => Promise.resolve({ resolveFont }), {
        _name: name,
        _options: {},
      }) as Provider
    }
    return { provider, calls }
  }

  async function resolveWith(options: FontlessOptions, override?: FontFamilyProviderOverride, result?: Partial<ResolveFontResult>) {
    const { provider, calls } = createTrackingProvider('test', result)
    const providers = { test: provider }
    const resolved: Array<ResolvedVariableAxisOptions | undefined> = []
    const faces: FontFaceData[] = []
    const resolver = await createResolver({
      options: { ...options, providers },
      providers,
      normalizeFontData: (data, opts) => {
        resolved.push(opts?.variableAxis)
        if (Array.isArray(data)) {
          faces.push(...data)
          return data
        }
        const src = Array.isArray(data.src) ? data.src : [data.src]
        return [{ ...data, src: src.map(source => typeof source === 'string' ? { url: source } : source) } as FontFaceData]
      },
    })

    await resolver('TestFont', override)

    return { calls, resolved, faces }
  }

  function requestedAxes(calls: Array<{ options: unknown }>) {
    return (calls[0]?.options as { variableAxis?: VariableAxisOptions }).variableAxis
  }

  it('should pass a family\'s requested axes to unifont, which normalises them', async () => {
    const { calls } = await resolveWith({}, { name: 'TestFont', variableAxis: { CASL: [1] } })

    expect(requestedAxes(calls)).toEqual({ CASL: ['1'] })
  })

  it('should prefer a family\'s axes over the default', async () => {
    const withDefault = await resolveWith({ defaults: { variableAxis: { CASL: [1] } } }, { name: 'TestFont' })
    const withOverride = await resolveWith({ defaults: { variableAxis: { CASL: [1] } } }, { name: 'TestFont', variableAxis: { MONO: [{ min: 0, max: 1 }] } })
    const withNothing = await resolveWith({})

    expect(requestedAxes(withDefault.calls)).toEqual({ CASL: ['1'] })
    expect(requestedAxes(withOverride.calls)).toEqual({ MONO: [['0', '1']] })
    expect(requestedAxes(withNothing.calls)).toBeUndefined()
  })

  it('should pass on how unifont resolved each axis', async () => {
    const { resolved } = await resolveWith({}, { name: 'TestFont', variableAxis: { MONO: [{ min: 0, max: 1 }] } }, {
      appliedVariableAxis: { MONO: [['0', '1']] },
    })

    expect(resolved).toEqual([{ MONO: { values: [['0', '1']], appliedAs: 'font-file' } }])
  })

  it('should take the descriptor unifont wrote, over any the provider wrote itself', async () => {
    const applied = [{ CASL: { values: ['1'], appliedAs: 'variation-settings' } }]
    const withoutOwn = await resolveWith({}, { name: 'TestFont', variableAxis: { CASL: [1] } })
    const withOwn = await resolveWith({}, { name: 'TestFont', variableAxis: { CASL: [1] } }, {
      fonts: [{ src: [{ url: '/font.woff2', format: 'woff2' }], variationSettings: '"CASL" 0' }],
    })

    expect([withoutOwn.resolved, withOwn.resolved]).toEqual([applied, applied])
    expect([withoutOwn.faces[0]?.variationSettings, withOwn.faces[0]?.variationSettings]).toEqual(['"CASL" 1', '"CASL" 1'])
  })

  it('should report nothing when no axes are requested', async () => {
    const { resolved } = await resolveWith({}, { name: 'TestFont' })

    expect(resolved).toEqual([undefined])
  })

  it('should treat every requested axis as its own for manually configured sources', async () => {
    const { resolved } = await resolveWith({}, {
      name: 'TestFont',
      variableAxis: { CASL: [1] },
      src: '/font.woff2',
    } as unknown as FontFamilyProviderOverride)

    expect(resolved).toEqual([{ CASL: { values: ['1'], appliedAs: 'none' } }])
  })
})
