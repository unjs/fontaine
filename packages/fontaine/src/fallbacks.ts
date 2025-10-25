export type FontCategory = 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting'

/**
 * Default fallback font stacks for each font category.
 * These are system fonts that work across different platforms.
 */
export const DEFAULT_CATEGORY_FALLBACKS: Record<FontCategory, string[]> = {
  'sans-serif': ['BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'Noto Sans'],
  'serif': ['Times New Roman', 'Georgia', 'Noto Serif'],
  'monospace': ['Courier New', 'Roboto Mono', 'Noto Sans Mono'],
  'display': ['BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'Noto Sans'],
  'handwriting': ['BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'Noto Sans'],
}

export interface ResolveCategoryFallbacksOptions {
  /** Font family name to resolve fallbacks for */
  fontFamily: string
  /** Global fallbacks (array) or per-family fallbacks (object). Array overrides all category-based resolution. */
  fallbacks: string[] | Record<string, string[]>
  /** Font metrics containing category information */
  metrics?: { category?: string } | null
  /** User-provided category fallback overrides */
  categoryFallbacks?: Partial<Record<FontCategory, string[]>>
}

/**
 * Resolves the appropriate fallback fonts for a given font family.
 *
 * Resolution order:
 * 1. If fallbacks is an array, use it as a global override
 * 2. If fallbacks is an object with the font family key, use that override
 * 3. If metrics contain a category, use the category-based fallbacks
 * 4. Default to sans-serif category fallbacks
 *
 * @param options - Configuration for fallback resolution
 * @returns Array of fallback font family names
 */
export function resolveCategoryFallbacks(options: ResolveCategoryFallbacksOptions): string[] {
  const { fontFamily, fallbacks, metrics, categoryFallbacks } = options

  // Merge user-provided category fallbacks with defaults
  const mergedCategoryFallbacks = { ...DEFAULT_CATEGORY_FALLBACKS }
  if (categoryFallbacks) {
    for (const category in categoryFallbacks) {
      const categoryKey = category as FontCategory
      const categoryFallbacksList = categoryFallbacks[categoryKey]
      if (categoryFallbacksList) {
        mergedCategoryFallbacks[categoryKey] = categoryFallbacksList
      }
    }
  }

  // 1. If fallbacks is an array, use it as a global override (legacy behavior)
  if (Array.isArray(fallbacks)) {
    return fallbacks
  }

  // 2. Return explicit per-family overrides when supplied (object notation)
  const familyFallback = fallbacks[fontFamily]
  if (familyFallback) {
    return familyFallback
  }

  // 3. If metrics have a category, return the merged preset for that category
  if (metrics?.category) {
    const categoryFallback = mergedCategoryFallbacks[metrics.category as FontCategory]
    if (categoryFallback) {
      return categoryFallback
    }
  }

  // 4. Fallback to sans-serif preset
  return mergedCategoryFallbacks['sans-serif']
}
