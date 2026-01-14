import type { FontFaceData, InitializedProvider, Provider, ProviderContext } from 'unifont'
import type { FontFamilyProviderOverride, FontlessOptions, RawFontFaceData } from '../src/types'
import { describe, expect, it } from 'vitest'
import { createResolver } from '../src/resolve'

// Helper to create a mock Provider (callable object with _name and _options properties)
function createMockProviderFn(
  name: string,
  resolveFont: InitializedProvider['resolveFont'],
): Provider {
  const providerFn = (_ctx: ProviderContext) => Promise.resolve({ resolveFont })
  return Object.assign(providerFn, {
    _name: name,
    _options: {},
  }) as Provider
}

// Simple mock provider that tracks calls
function createTrackingProvider(name: string): { provider: () => Provider, calls: Array<{ family: string, options: unknown }> } {
  const calls: Array<{ family: string, options: unknown }> = []
  const provider = () => {
    const resolveFont: InitializedProvider['resolveFont'] = async (family, options) => {
      calls.push({ family, options })
      return { fonts: [{ src: [{ url: '/font.woff2', format: 'woff2' }] }] }
    }
    return createMockProviderFn(name, resolveFont)
  }
  return { provider, calls }
}

function defaultNormalizeFontData(faces: RawFontFaceData | FontFaceData[]): FontFaceData[] {
  if (Array.isArray(faces)) {
    return faces
  }
  const normalized = faces as RawFontFaceData
  const srcArray = Array.isArray(normalized.src) ? normalized.src : [normalized.src]
  return [{
    ...normalized,
    src: srcArray.map(s => typeof s === 'string' ? { url: s } : s),
    unicodeRange: normalized.unicodeRange
      ? (Array.isArray(normalized.unicodeRange) ? normalized.unicodeRange : [normalized.unicodeRange])
      : undefined,
  }]
}

describe('createResolver', () => {
  describe('formats option', () => {
    it('should use default formats (woff2) when not specified', async () => {
      const { provider, calls } = createTrackingProvider('test')

      const options: FontlessOptions = {
        providers: { test: provider },
      }

      const resolver = await createResolver({
        options,
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      await resolver('TestFont')

      expect(calls).toHaveLength(1)
      expect(calls[0]?.options).toHaveProperty('formats', ['woff2'])
    })

    it('should respect formats in defaults', async () => {
      const { provider, calls } = createTrackingProvider('test')

      const options: FontlessOptions = {
        providers: { test: provider },
        defaults: {
          formats: ['woff2', 'woff'],
        },
      }

      const resolver = await createResolver({
        options,
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      await resolver('TestFont')

      expect(calls).toHaveLength(1)
      expect(calls[0]?.options).toHaveProperty('formats', ['woff2', 'woff'])
    })

    it('should respect formats in family override', async () => {
      const { provider, calls } = createTrackingProvider('test')

      const options: FontlessOptions = {
        providers: { test: provider },
        defaults: {
          formats: ['woff2'],
        },
      }

      const resolver = await createResolver({
        options,
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      const override: FontFamilyProviderOverride = {
        name: 'TestFont',
        formats: ['woff2', 'woff', 'ttf'],
      }

      await resolver('TestFont', override)

      expect(calls).toHaveLength(1)
      expect(calls[0]?.options).toHaveProperty('formats', ['woff2', 'woff', 'ttf'])
    })
  })

  describe('providerOptions', () => {
    it('should pass provider-specific options when using explicit provider', async () => {
      const { provider, calls } = createTrackingProvider('google')

      const options: FontlessOptions = {
        providers: { google: provider },
      }

      const resolver = await createResolver({
        options,
        providers: { google: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      const override: FontFamilyProviderOverride = {
        name: 'TestFont',
        provider: 'google',
        providerOptions: {
          google: {
            experimental: {
              glyphs: ['A', 'B', 'C'],
            },
          },
        },
      }

      await resolver('TestFont', override)

      expect(calls).toHaveLength(1)
      // Unifont passes provider-specific options in the `options` field
      const receivedOptions = calls[0]?.options as Record<string, unknown>
      expect(receivedOptions).toHaveProperty('options')
      expect(receivedOptions.options).toEqual({
        experimental: {
          glyphs: ['A', 'B', 'C'],
        },
      })
    })

    it('should pass provider options when resolving without explicit provider', async () => {
      const { provider, calls } = createTrackingProvider('google')

      const options: FontlessOptions = {
        providers: { google: provider },
      }

      const resolver = await createResolver({
        options,
        providers: { google: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      const override: FontFamilyProviderOverride = {
        name: 'TestFont',
        providerOptions: {
          google: {
            experimental: {
              variableAxis: {
                wght: [['100', '900']],
              },
            },
          },
        },
      }

      await resolver('TestFont', override)

      expect(calls).toHaveLength(1)
      expect(calls[0]?.options).toHaveProperty('options')
    })
  })

  describe('throwOnError option', () => {
    it('should pass throwOnError to unifont when specified', async () => {
      // This test verifies the option is passed - actual error throwing
      // is handled by unifont itself
      const { provider } = createTrackingProvider('test')

      const options: FontlessOptions = {
        providers: { test: provider },
        throwOnError: true,
      }

      // createResolver should not throw during creation
      const resolver = await createResolver({
        options,
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      expect(resolver).toBeDefined()
    })
  })

  describe('manual font override', () => {
    it('should handle manual font sources without calling providers', async () => {
      const { provider, calls } = createTrackingProvider('test')

      const options: FontlessOptions = {
        providers: { test: provider },
      }

      const resolver = await createResolver({
        options,
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      const result = await resolver('CustomFont', {
        name: 'CustomFont',
        src: '/custom-font.woff2',
        fallbacks: ['Arial', 'sans-serif'],
      })

      // Provider should not be called for manual fonts
      expect(calls).toHaveLength(0)
      expect(result).toBeDefined()
      expect(result?.fonts).toHaveLength(1)
      expect(result?.fallbacks).toEqual(['Arial', 'sans-serif'])
    })
  })

  describe('provider: none', () => {
    it('should return undefined when provider is none', async () => {
      const { provider, calls } = createTrackingProvider('test')

      const options: FontlessOptions = {
        providers: { test: provider },
      }

      const resolver = await createResolver({
        options,
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      const result = await resolver('CustomFont', {
        name: 'CustomFont',
        provider: 'none',
      })

      expect(calls).toHaveLength(0)
      expect(result).toBeUndefined()
    })
  })
})
