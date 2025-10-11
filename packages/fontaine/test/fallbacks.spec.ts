import { describe, expect, it } from 'vitest'
import { DEFAULT_CATEGORY_FALLBACKS, resolveCategoryFallbacks } from '../src/fallbacks'

describe('fallbacks module', () => {
  describe('dEFAULT_CATEGORY_FALLBACKS', () => {
    it('should export default category fallbacks', () => {
      expect(DEFAULT_CATEGORY_FALLBACKS).toBeDefined()
      expect(DEFAULT_CATEGORY_FALLBACKS['sans-serif']).toEqual(['BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'Noto Sans'])
      expect(DEFAULT_CATEGORY_FALLBACKS.serif).toEqual(['Times New Roman', 'Georgia', 'Noto Serif'])
      expect(DEFAULT_CATEGORY_FALLBACKS.monospace).toEqual(['Courier New', 'Roboto Mono', 'Noto Sans Mono'])
      expect(DEFAULT_CATEGORY_FALLBACKS.display).toEqual(['BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'Noto Sans'])
      expect(DEFAULT_CATEGORY_FALLBACKS.handwriting).toEqual(['BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'Noto Sans'])
    })
  })

  describe('resolveCategoryFallbacks', () => {
    it('should return global fallbacks array when fallbacks is an array', () => {
      const result = resolveCategoryFallbacks({
        fontFamily: 'Poppins',
        fallbacks: ['Arial', 'Helvetica'],
        metrics: { category: 'sans-serif' },
      })
      expect(result).toEqual(['Arial', 'Helvetica'])
    })

    it('should return per-family fallbacks when specified in object', () => {
      const result = resolveCategoryFallbacks({
        fontFamily: 'Poppins',
        fallbacks: { Poppins: ['Custom Font'], Roboto: ['Another Font'] },
        metrics: { category: 'sans-serif' },
      })
      expect(result).toEqual(['Custom Font'])
    })

    it('should use category fallbacks from metrics when no explicit override', () => {
      const result = resolveCategoryFallbacks({
        fontFamily: 'Lora',
        fallbacks: {},
        metrics: { category: 'serif' },
      })
      expect(result).toEqual(DEFAULT_CATEGORY_FALLBACKS.serif)
    })

    it('should use custom category fallbacks when provided', () => {
      const result = resolveCategoryFallbacks({
        fontFamily: 'Lora',
        fallbacks: {},
        metrics: { category: 'serif' },
        categoryFallbacks: { serif: ['Georgia Only'] },
      })
      expect(result).toEqual(['Georgia Only'])
    })

    it('should fall back to sans-serif when no category in metrics', () => {
      const result = resolveCategoryFallbacks({
        fontFamily: 'UnknownFont',
        fallbacks: {},
        metrics: {},
      })
      expect(result).toEqual(DEFAULT_CATEGORY_FALLBACKS['sans-serif'])
    })

    it('should fall back to sans-serif when metrics is null', () => {
      const result = resolveCategoryFallbacks({
        fontFamily: 'UnknownFont',
        fallbacks: {},
        metrics: null,
      })
      expect(result).toEqual(DEFAULT_CATEGORY_FALLBACKS['sans-serif'])
    })

    it('should prioritize per-family overrides over category fallbacks', () => {
      const result = resolveCategoryFallbacks({
        fontFamily: 'Lora',
        fallbacks: { Lora: ['Arial'] },
        metrics: { category: 'serif' },
        categoryFallbacks: { serif: ['Georgia'] },
      })
      expect(result).toEqual(['Arial'])
    })

    it('should prioritize global array overrides over everything', () => {
      const result = resolveCategoryFallbacks({
        fontFamily: 'Lora',
        fallbacks: ['Helvetica'],
        metrics: { category: 'serif' },
        categoryFallbacks: { serif: ['Georgia'] },
      })
      expect(result).toEqual(['Helvetica'])
    })

    it('should handle monospace category', () => {
      const result = resolveCategoryFallbacks({
        fontFamily: 'JetBrains Mono',
        fallbacks: {},
        metrics: { category: 'monospace' },
      })
      expect(result).toEqual(DEFAULT_CATEGORY_FALLBACKS.monospace)
    })

    it('should handle display category', () => {
      const result = resolveCategoryFallbacks({
        fontFamily: 'Bebas Neue',
        fallbacks: {},
        metrics: { category: 'display' },
      })
      expect(result).toEqual(DEFAULT_CATEGORY_FALLBACKS.display)
    })

    it('should handle handwriting category', () => {
      const result = resolveCategoryFallbacks({
        fontFamily: 'Dancing Script',
        fallbacks: {},
        metrics: { category: 'handwriting' },
      })
      expect(result).toEqual(DEFAULT_CATEGORY_FALLBACKS.handwriting)
    })
  })
})
