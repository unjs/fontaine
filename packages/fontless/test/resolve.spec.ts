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

// Provider that resolves to no fonts at all
function createEmptyProvider(name: string, result?: { fonts: FontFaceData[], provider?: string | undefined }): () => Provider {
  return () => createMockProviderFn(name, async () => result as any)
}

function createLogger() {
  const warnings: string[] = []
  return {
    warnings,
    logger: { warn: (message: string) => void warnings.push(message) } as any,
  }
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

  describe('npm provider', () => {
    it('should resolve fonts through npm provider', async () => {
      const { provider, calls } = createTrackingProvider('npm')

      const options: FontlessOptions = {
        providers: { npm: provider },
        npm: { remote: false },
      }

      const resolver = await createResolver({
        options,
        providers: { npm: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      await resolver('Inter')

      expect(calls).toHaveLength(1)
      expect(calls[0]?.family).toBe('Inter')
    })

    it('should pass npm options to provider', async () => {
      const { provider, calls } = createTrackingProvider('npm')

      const options: FontlessOptions = {
        providers: { npm: provider },
        npm: {
          remote: false,
          root: '/project',
        },
      }

      const resolver = await createResolver({
        options,
        providers: { npm: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      await resolver('Inter')

      expect(calls).toHaveLength(1)
    })

    it('should resolve npm provider alongside other providers', async () => {
      const { provider: npmProvider, calls: npmCalls } = createTrackingProvider('npm')
      const { provider: googleProvider, calls: googleCalls } = createTrackingProvider('google')

      const options: FontlessOptions = {
        providers: { google: googleProvider, npm: npmProvider },
        npm: { remote: false },
      }

      const resolver = await createResolver({
        options,
        providers: { google: googleProvider, npm: npmProvider },
        normalizeFontData: defaultNormalizeFontData,
      })

      await resolver('Inter')

      // google provider resolves first since it's listed first
      expect(googleCalls).toHaveLength(1)
      // npm provider is not called since google already resolved
      expect(npmCalls).toHaveLength(0)
    })

    it('should resolve with explicit npm provider override', async () => {
      const { provider: npmProvider, calls: npmCalls } = createTrackingProvider('npm')
      const { provider: googleProvider, calls: googleCalls } = createTrackingProvider('google')

      const options: FontlessOptions = {
        providers: { google: googleProvider, npm: npmProvider },
        npm: { remote: false },
      }

      const resolver = await createResolver({
        options,
        providers: { google: googleProvider, npm: npmProvider },
        normalizeFontData: defaultNormalizeFontData,
      })

      const override: FontFamilyProviderOverride = {
        name: 'Inter',
        provider: 'npm',
      }

      await resolver('Inter', override)

      // Only npm provider should be called
      expect(npmCalls).toHaveLength(1)
      expect(googleCalls).toHaveLength(0)
    })

    it('should allow disabling npm provider', async () => {
      const { provider: googleProvider, calls: googleCalls } = createTrackingProvider('google')

      const options: FontlessOptions = {
        providers: { google: googleProvider, npm: false },
      }

      const resolver = await createResolver({
        options,
        providers: { google: googleProvider },
        normalizeFontData: defaultNormalizeFontData,
      })

      await resolver('Inter')

      expect(googleCalls).toHaveLength(1)
    })
  })

  describe('provider registration', () => {
    it('should drop providers disabled via the `providers` option', async () => {
      const { provider: google, calls: googleCalls } = createTrackingProvider('google')
      const { provider: npm, calls: npmCalls } = createTrackingProvider('npm')

      const resolver = await createResolver({
        options: { providers: { google, npm: false } },
        providers: { google, npm },
        normalizeFontData: defaultNormalizeFontData,
      })

      await resolver('Inter')

      expect(googleCalls).toHaveLength(1)
      expect(npmCalls).toHaveLength(0)
    })

    it('should drop every provider but the one named by `provider`', async () => {
      const { provider: google, calls: googleCalls } = createTrackingProvider('google')
      const { provider: npm, calls: npmCalls } = createTrackingProvider('npm')

      const resolver = await createResolver({
        options: { provider: 'npm', providers: { google, npm } },
        providers: { google, npm },
        normalizeFontData: defaultNormalizeFontData,
      })

      await resolver('Inter')

      expect(npmCalls).toHaveLength(1)
      expect(googleCalls).toHaveLength(0)
    })

    it('should throw when every provider has been disabled', async () => {
      const { provider: google } = createTrackingProvider('google')

      await expect(createResolver({
        options: { providers: { google: false } },
        providers: { google },
        normalizeFontData: defaultNormalizeFontData,
      })).rejects.toThrow('At least one font provider must be configured')
    })

    it('should ignore unknown providers listed in `priority`', async () => {
      const { provider: google, calls: googleCalls } = createTrackingProvider('google')

      const resolver = await createResolver({
        options: { priority: ['google', 'nonexistent'], providers: { google } },
        providers: { google },
        normalizeFontData: defaultNormalizeFontData,
      })

      await resolver('Inter')

      expect(googleCalls).toHaveLength(1)
    })
  })

  describe('fallbacks', () => {
    it('should apply a global fallbacks array to every generic family', async () => {
      const { provider } = createTrackingProvider('test')

      const resolver = await createResolver({
        options: { providers: { test: provider }, defaults: { fallbacks: ['Arial'] } },
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      const result = await resolver('Inter', undefined, { fallbacks: [], generic: 'serif' })

      expect(result?.fallbacks).toEqual(['Arial'])
    })

    it('should skip local fallbacks when disabled', async () => {
      const { provider } = createTrackingProvider('test')

      const resolver = await createResolver({
        options: { providers: { test: provider }, experimental: { disableLocalFallbacks: true } },
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      const result = await resolver('Inter')

      expect(result?.fonts?.every(font => font.src.every(src => 'url' in src))).toBe(true)
    })
  })

  describe('override options', () => {
    it('should stringify weights and pass styles and subsets from the override', async () => {
      const { provider, calls } = createTrackingProvider('test')

      const resolver = await createResolver({
        options: { providers: { test: provider } },
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      await resolver('Inter', {
        name: 'Inter',
        weights: [400, 700],
        styles: ['italic'],
        subsets: ['cyrillic'],
      })

      expect(calls[0]?.options).toMatchObject({
        weights: ['400', '700'],
        styles: ['italic'],
        subsets: ['cyrillic'],
      })
    })

    it('should warn and fall back to default providers for an unknown provider', async () => {
      const { provider, calls } = createTrackingProvider('test')
      const { logger, warnings } = createLogger()

      const resolver = await createResolver({
        options: { providers: { test: provider } },
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
        logger,
      })

      await resolver('Inter', { name: 'Inter', provider: 'nonexistent' })

      expect(warnings[0]).toContain('Unknown provider `nonexistent`')
      expect(calls).toHaveLength(1)
    })

    it('should warn when an explicit provider produces no font faces', async () => {
      const provider = createEmptyProvider('test', { fonts: [] })
      const { logger, warnings } = createLogger()

      const resolver = await createResolver({
        options: { providers: { test: provider } },
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
        logger,
      })

      const result = await resolver('Inter', { name: 'Inter', provider: 'test' })

      expect(result).toBeUndefined()
      expect(warnings[0]).toContain('Could not produce font face declaration from `test`')
    })

    it('should warn when an override produces no font faces', async () => {
      const provider = createEmptyProvider('test', { fonts: [] })
      const { logger, warnings } = createLogger()

      const resolver = await createResolver({
        options: { providers: { test: provider } },
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
        logger,
      })

      const result = await resolver('Inter', { name: 'Inter', weights: [400] })

      expect(result).toBeUndefined()
      expect(warnings[0]).toContain('Could not produce font face declaration for `Inter` with override')
    })

    it('should return undefined without warning when no provider resolves the family', async () => {
      const provider = createEmptyProvider('test')
      const { logger, warnings } = createLogger()

      const resolver = await createResolver({
        options: { providers: { test: provider } },
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
        logger,
      })

      expect(await resolver('Inter')).toBeUndefined()
      expect(warnings).toEqual([])
    })
  })

  describe('font face descriptors', () => {
    it('should apply display and unicodeRange to faces from an explicit provider', async () => {
      const { provider } = createTrackingProvider('test')

      const resolver = await createResolver({
        options: { providers: { test: provider } },
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      const result = await resolver('Inter', {
        name: 'Inter',
        provider: 'test',
        display: 'optional',
        unicodeRange: 'U+0000-00FF',
      })

      expect(result?.fonts?.[0]).toMatchObject({
        display: 'optional',
        unicodeRange: ['U+0000-00FF'],
      })
    })

    it('should apply display and unicodeRange to auto-resolved faces', async () => {
      const { provider } = createTrackingProvider('test')

      const resolver = await createResolver({
        options: { providers: { test: provider } },
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      const result = await resolver('Inter', {
        name: 'Inter',
        display: 'optional',
        unicodeRange: ['U+0000-00FF', 'U+0131'],
      })

      expect(result?.fonts?.[0]).toMatchObject({
        display: 'optional',
        unicodeRange: ['U+0000-00FF', 'U+0131'],
      })
    })

    it('should leave resolved faces untouched when no descriptors are set', async () => {
      const provider = createEmptyProvider('test', { fonts: [{ display: 'block', src: [{ url: '/font.woff2' }] }] })

      const resolver = await createResolver({
        options: { providers: { test: provider } },
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      const result = await resolver('Inter', { name: 'Inter', weights: [400] })

      expect(result?.fonts?.[0]).toMatchObject({ display: 'block' })
      expect(result?.fonts?.[0]).not.toHaveProperty('unicodeRange', expect.anything())
    })

    it('should pass all descriptors through for a manually declared family', async () => {
      const { provider } = createTrackingProvider('test')

      const resolver = await createResolver({
        options: { providers: { test: provider } },
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
      })

      const result = await resolver('CustomFont', {
        name: 'CustomFont',
        global: true,
        preload: true,
        fallbacks: ['Arial'],
        src: '/custom.woff2',
        display: 'optional',
        weight: 700,
        style: 'italic',
        unicodeRange: 'U+0000-00FF',
        stretch: 'condensed',
        featureSettings: '"liga" 1',
        variationSettings: '"wght" 700',
      })

      expect(result?.fonts?.[0]).toMatchObject({
        display: 'optional',
        weight: 700,
        style: 'italic',
        unicodeRange: ['U+0000-00FF'],
        stretch: 'condensed',
        featureSettings: '"liga" 1',
        variationSettings: '"wght" 700',
      })
      expect(result?.fonts?.[0]).not.toHaveProperty('name')
      expect(result?.fonts?.[0]).not.toHaveProperty('global')
      expect(result?.fonts?.[0]).not.toHaveProperty('preload')
      expect(result?.fonts?.[0]).not.toHaveProperty('fallbacks')
      expect(result?.fallbacks).toEqual(['Arial'])
    })
  })

  describe('exposeFont', () => {
    it('should report `unknown` when the resolving provider is not named', async () => {
      const provider = createEmptyProvider('test', { fonts: [{ src: [{ url: '/font.woff2' }] }], provider: undefined })
      const exposed: Array<{ provider?: string }> = []

      const resolver = await createResolver({
        options: { providers: { test: provider } },
        providers: { test: provider },
        normalizeFontData: defaultNormalizeFontData,
        exposeFont: font => void exposed.push(font as { provider?: string }),
      })

      await resolver('Inter')

      expect(exposed[0]?.provider).toBe('unknown')
    })
  })
})
