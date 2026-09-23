import type { FontFaceData } from 'unifont'
import type { PreloadOption } from './types'

const UNICODE_RANGE_RE = /^\s*u\+([0-9a-f?]{1,6})(?:-([0-9a-f]{1,6}))?\s*$/i

// 'A', standing in for Basic Latin: no provider reports which subset a site renders.
const REPRESENTATIVE_CODE_POINT = 0x41

const PREFERRED_WEIGHT = 400

function coversBasicLatin(font: FontFaceData): boolean {
  if (!font.unicodeRange?.length) {
    return true
  }
  return font.unicodeRange.some((range) => {
    const match = range.match(UNICODE_RANGE_RE)
    if (!match) {
      return false
    }
    const start = Number.parseInt(match[1]!.replaceAll('?', '0'), 16)
    const end = match[2] ? Number.parseInt(match[2], 16) : Number.parseInt(match[1]!.replaceAll('?', 'f'), 16)
    return start <= REPRESENTATIVE_CODE_POINT && REPRESENTATIVE_CODE_POINT <= end
  })
}

function weightValues(font: FontFaceData): number[] {
  const weight = font.weight ?? PREFERRED_WEIGHT
  return (Array.isArray(weight) ? weight : String(weight).split(' '))
    .map(value => Number(value))
    .filter(value => !Number.isNaN(value))
}

function matchesWeight(font: FontFaceData, weights: Array<string | number>): boolean {
  const values = weightValues(font)
  return weights.some((weight) => {
    const value = Number(weight)
    if (Number.isNaN(value) || values.length === 0) {
      return String(weight) === String(font.weight)
    }
    return value >= Math.min(...values) && value <= Math.max(...values)
  })
}

function subsetRank(font: FontFaceData, subsets: string[] | undefined): number {
  const latinRank = coversBasicLatin(font) ? 0 : 1
  if (!subsets) {
    return latinRank
  }
  const index = font.meta?.subset ? subsets.indexOf(font.meta.subset) : -1
  return index === -1 ? subsets.length + latinRank : index
}

function weightRank(font: FontFaceData): number {
  const distances = weightValues(font).map(value => Math.abs(value - PREFERRED_WEIGHT))
  return distances.length > 0 ? Math.min(...distances) : PREFERRED_WEIGHT
}

function styleRank(font: FontFaceData): number {
  return !font.style || font.style === 'normal' ? 0 : 1
}

/** Negative where `a` is the better single preload for a family. */
function compareFaces(a: FontFaceData, b: FontFaceData, subsets: string[] | undefined): number {
  return (a.meta?.priority || 0) - (b.meta?.priority || 0)
    || subsetRank(a, subsets) - subsetRank(b, subsets)
    || styleRank(a) - styleRank(b)
    || weightRank(a) - weightRank(b)
}

/**
 * Pick the faces to emit `<link rel="preload">` for, from every face resolved for a family.
 *
 * `preload: true` picks one: the lowest-priority, upright face closest to weight 400,
 * covering the first matching entry of `subsets`, falling back to Basic Latin coverage.
 */
export function selectPreloadFonts(fontFamily: string, fonts: FontFaceData[], preload: PreloadOption | undefined, subsets?: string[]): FontFaceData[] {
  if (!preload) {
    return []
  }

  if (typeof preload === 'function') {
    return fonts.filter(font => preload(fontFamily, font))
  }

  if (preload === true) {
    return fonts.length > 0
      ? [fonts.reduce((best, font) => compareFaces(font, best, subsets) < 0 ? font : best)]
      : []
  }

  return fonts.filter(font => (
    (!preload.subsets || (!!font.meta?.subset && preload.subsets.includes(font.meta.subset)))
    && (!preload.styles || preload.styles.includes(font.style || 'normal'))
    && (!preload.weights || matchesWeight(font, preload.weights))
  ))
}
