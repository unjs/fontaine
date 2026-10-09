import type { FontFaceData } from 'unifont'

const WEIGHT_NAMES: Record<number, string> = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
}

/** A face's weight and style as a type designer would name it, such as `Bold Italic` or `Variable 100–900`. */
export function styleName(font: Pick<FontFaceData, 'weight' | 'style'>): string {
  const weights = (Array.isArray(font.weight) ? font.weight : String(font.weight ?? 400).split(' ')).map(Number)
  const weight = weights.length > 1 && weights[0] !== weights[1]
    ? `Variable ${weights[0]}–${weights[1]}`
    : WEIGHT_NAMES[weights[0]!] ?? String(weights[0])
  const style = font.style && font.style !== 'normal' ? font.style[0]!.toUpperCase() + font.style.slice(1) : ''
  return weight === 'Regular' && style ? style : [weight, style].filter(Boolean).join(' ')
}

/** CSS `font-weight` for a face. */
export function cssWeight(font: Pick<FontFaceData, 'weight'>): string {
  return Array.isArray(font.weight) ? font.weight.join(' ') : String(font.weight ?? 400)
}

const SUBSETS: Array<[start: string, name: string]> = [
  ['U+0000-00FF', 'Latin'],
  ['U+0100-02BA', 'Latin Extended'],
  ['U+0100-024F', 'Latin Extended'],
  ['U+0102-0103', 'Vietnamese'],
  ['U+0460-052F', 'Cyrillic Extended'],
  ['U+0301', 'Cyrillic'],
  ['U+0400-045F', 'Cyrillic'],
  ['U+1F00-1FFF', 'Greek Extended'],
  ['U+0370-0377', 'Greek'],
  ['U+0370-03FF', 'Greek'],
]

/** The script a face's `unicode-range` covers, where it is one of the common Google Fonts subsets. */
export function subsetName(unicodeRange?: string[]): string | undefined {
  const first = unicodeRange?.[0]?.toUpperCase()
  if (!first) {
    return
  }
  return SUBSETS.find(([start]) => start === first)?.[1] ?? `${unicodeRange!.length} ${unicodeRange!.length === 1 ? 'range' : 'ranges'}`
}
