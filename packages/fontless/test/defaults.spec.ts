import { DEFAULT_CATEGORY_FALLBACKS } from 'fontaine'
import { describe, expect, it } from 'vitest'
import { defaultOptions, defaultValues } from '../src/defaults'

describe('fontless defaults', () => {
  describe('fallbacks', () => {
    it('should use shared category-aware presets from fontaine', () => {
      expect(defaultValues.fallbacks.serif).toEqual(DEFAULT_CATEGORY_FALLBACKS.serif)
      expect(defaultValues.fallbacks['sans-serif']).toEqual(DEFAULT_CATEGORY_FALLBACKS['sans-serif'])
      expect(defaultValues.fallbacks.monospace).toEqual(DEFAULT_CATEGORY_FALLBACKS.monospace)
    })

    it('should map generic families to category presets', () => {
      // Core generic families should use category presets
      expect(defaultValues.fallbacks.serif).toEqual(['Times New Roman', 'Georgia', 'Noto Serif'])
      expect(defaultValues.fallbacks['sans-serif']).toEqual(['BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'Noto Sans'])
      expect(defaultValues.fallbacks.monospace).toEqual(['Courier New', 'Roboto Mono', 'Noto Sans Mono'])
    })

    it('should map ui- families to appropriate category presets', () => {
      expect(defaultValues.fallbacks['ui-serif']).toEqual(DEFAULT_CATEGORY_FALLBACKS.serif)
      expect(defaultValues.fallbacks['ui-sans-serif']).toEqual(DEFAULT_CATEGORY_FALLBACKS['sans-serif'])
      expect(defaultValues.fallbacks['ui-monospace']).toEqual(DEFAULT_CATEGORY_FALLBACKS.monospace)
    })

    it('should map cursive to handwriting preset', () => {
      expect(defaultValues.fallbacks.cursive).toEqual(DEFAULT_CATEGORY_FALLBACKS.handwriting)
    })

    it('should map fantasy to display preset', () => {
      expect(defaultValues.fallbacks.fantasy).toEqual(DEFAULT_CATEGORY_FALLBACKS.display)
    })

    it('should map system-ui to sans-serif preset', () => {
      expect(defaultValues.fallbacks['system-ui']).toEqual(DEFAULT_CATEGORY_FALLBACKS['sans-serif'])
    })

    it('should have empty arrays for specialized families', () => {
      expect(defaultValues.fallbacks['ui-rounded']).toEqual([])
      expect(defaultValues.fallbacks.emoji).toEqual([])
      expect(defaultValues.fallbacks.math).toEqual([])
      expect(defaultValues.fallbacks.fangsong).toEqual([])
    })
  })

  describe('weights', () => {
    it('should default to [400]', () => {
      expect(defaultValues.weights).toEqual([400])
    })
  })

  describe('styles', () => {
    it('should default to normal and italic', () => {
      expect(defaultValues.styles).toEqual(['normal', 'italic'])
    })
  })

  describe('subsets', () => {
    it('should include common unicode subsets', () => {
      expect(defaultValues.subsets).toContain('latin')
      expect(defaultValues.subsets).toContain('latin-ext')
      expect(defaultValues.subsets).toContain('cyrillic')
      expect(defaultValues.subsets).toContain('greek')
    })
  })

  describe('providers', () => {
    it('should include npm provider in default providers', () => {
      expect(defaultOptions.providers).toHaveProperty('npm')
      expect(defaultOptions.providers!.npm).toBeDefined()
      expect(defaultOptions.providers!.npm).not.toBe(false)
    })

    it('should set npm remote to false by default', () => {
      expect(defaultOptions.npm).toBeDefined()
      expect(defaultOptions.npm).toHaveProperty('remote', false)
    })
  })
})
