import type { Buffer } from 'node:buffer'
import type { ResolvedVariableAxisOptions, VariableAxisOptions } from './types'
import { consola } from 'consola'

const logger = consola.withTag('fontless')

/**
 * Normalise a family's `glyphs` option into a stable string of unique characters.
 *
 * Sorting and deduplicating means an equivalent glyph list always produces the same
 * emitted file name, whichever order it was written in.
 */
export function normalizeGlyphs(glyphs?: string | string[]): string | undefined {
  if (!glyphs) {
    return undefined
  }
  const characters = [...new Set(Array.isArray(glyphs) ? glyphs.join('') : glyphs)]
  return characters.length > 0 ? characters.sort().join('') : undefined
}

/**
 * Express a normalised glyph list as a CSS `unicode-range` value, coalescing consecutive
 * codepoints into ranges.
 */
export function glyphsToUnicodeRange(glyphs: string): string[] {
  const codepoints = [...new Set([...glyphs].map(character => character.codePointAt(0)!))].sort((a, b) => a - b)
  const ranges: string[] = []
  for (let index = 0; index < codepoints.length; index++) {
    const start = codepoints[index]!
    let end = start
    while (codepoints[index + 1] === end + 1) {
      end = codepoints[++index]!
    }
    ranges.push(end > start ? `U+${toHex(start)}-${toHex(end)}` : `U+${toHex(start)}`)
  }
  return ranges
}

function toHex(codepoint: number): string {
  return codepoint.toString(16).toUpperCase().padStart(4, '0')
}

/** Axis values to apply to a font file: a number pins the axis, a range narrows it. */
export type VariationAxes = Record<string, number | { min: number, max: number }>

/** Axes `@font-face` descriptors select, so instancing them would lose faces. */
const DESCRIPTOR_AXES = new Set(['wght', 'ital'])

/** Codepoints beyond which a face's `unicode-range` is too large to expand. */
const MAX_DERIVED_CODEPOINTS = 5000

/**
 * Remove `tags` from a `font-variation-settings` value (`"<tag>" <value>`, comma
 * separated), returning `undefined` if no entry remains.
 */
export function withoutVariationSettings(value: string | undefined, tags: Iterable<string>): string | undefined {
  const removed = new Set(tags)
  const remaining = (value?.split(',') ?? [])
    .map(entry => entry.trim())
    .filter(entry => entry !== '' && !removed.has(/^["']([^"']+)["']/.exec(entry)?.[1] as string))
  return remaining.length > 0 ? remaining.join(', ') : undefined
}

/** Express requested axis values the way `unifont` reports them back. */
export function normalizeAxisValues(variableAxis: VariableAxisOptions): ResolvedVariableAxisOptions {
  const normalized: ResolvedVariableAxisOptions = {}
  for (const [tag, values] of Object.entries(variableAxis)) {
    if (!values?.length) {
      continue
    }
    normalized[tag] = {
      values: values.map(value => typeof value === 'number' || typeof value === 'string'
        ? String(value)
        : Array.isArray(value)
          ? [String(value[0]), String(value[1])]
          : [String(value.min), String(value.max)]),
      appliedAs: 'none',
    }
  }
  return normalized
}

/** A single requested value as a pin or a range, or `undefined` if it is not one axis value. */
function toVariationAxis(values: Array<string | [string, string]>): VariationAxes[string] | undefined {
  if (values.length !== 1) {
    return undefined
  }
  const value = values[0]!
  if (!Array.isArray(value)) {
    const pin = Number(value)
    return Number.isFinite(pin) ? pin : undefined
  }
  const min = Number(value[0])
  const max = Number(value[1])
  return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : undefined
}

/**
 * Axis values `fontless` can apply to a font file itself, and (as `pinned`) the tags whose
 * descriptor instancing the file makes redundant.
 */
export function resolveVariationAxes(variableAxis: ResolvedVariableAxisOptions): { axes: VariationAxes, pinned: string[] } | undefined {
  const axes: VariationAxes = {}
  const pinned: string[] = []
  for (const [tag, resolved] of Object.entries(variableAxis)) {
    if (!resolved || resolved.appliedAs === 'font-file' || DESCRIPTOR_AXES.has(tag)) {
      continue
    }
    const axis = toVariationAxis(resolved.values)
    if (axis === undefined) {
      continue
    }
    axes[tag] = axis
    if (resolved.appliedAs === 'variation-settings' && typeof axis === 'number') {
      pinned.push(tag)
    }
  }
  return Object.keys(axes).length > 0 ? { axes, pinned } : undefined
}

/**
 * Expand a face's `unicode-range` into the characters it declares, so a font can be
 * instanced without narrowing what it can render. `undefined` if the range is too large.
 */
export function unicodeRangeToText(unicodeRange?: string[]): string | undefined {
  if (!unicodeRange?.length) {
    return undefined
  }
  let text = ''
  let count = 0
  for (const entry of unicodeRange) {
    const [rawStart, rawEnd] = entry.trim().replace(/^u\+/i, '').split('-')
    if (!rawStart) {
      return undefined
    }
    const start = Number.parseInt(rawStart.replaceAll('?', '0'), 16)
    const end = rawEnd ? Number.parseInt(rawEnd, 16) : Number.parseInt(rawStart.replaceAll('?', 'F'), 16)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      return undefined
    }
    count += end - start + 1
    if (count > MAX_DERIVED_CODEPOINTS) {
      return undefined
    }
    for (let codepoint = start; codepoint <= end; codepoint++) {
      text += String.fromCodePoint(codepoint)
    }
  }
  return text
}

type Subsetter = typeof import('subset-font')

let subsetter: Promise<Subsetter> | undefined

/**
 * `subset-font` is an optional peer dependency, and the harfbuzz wasm it loads is several
 * megabytes, so it is resolved lazily and only by projects that set `glyphs`.
 */
function loadSubsetter(): Promise<Subsetter> {
  subsetter ??= import('subset-font').then(module => module.default, (cause) => {
    subsetter = undefined
    throw new Error('Subsetting fonts with `glyphs` requires the `subset-font` package. Install it as a dependency of your project, or remove the `glyphs` option.', { cause })
  })
  return subsetter
}

/**
 * Reduce `font` to the glyphs needed to render `text`, keeping its original format, and
 * apply `variationAxes` to its variation space.
 *
 * Throws if `subset-font` is not installed: a project that asked for a subset should not
 * silently be given a full font. Fonts harfbuzz cannot process are passed through with a
 * warning instead, as not every format can be subsetted.
 */
export async function subsetFontData(font: Buffer, text: string, url: string, variationAxes?: VariationAxes): Promise<Buffer> {
  const subsetFont = await loadSubsetter()
  const axes = variationAxes && Object.keys(variationAxes).length > 0 ? variationAxes : undefined
  if (axes) {
    try {
      return await subsetFont(font, text, { variationAxes: axes })
    }
    catch (error) {
      // An axis the font does not have fails the whole subset, glyphs included.
      logger.warn(`Could not apply variable font axes \`${Object.keys(axes).join('`, `')}\` to \`${url}\`. Emitting the font with its axes unchanged.`, error)
    }
  }
  try {
    return await subsetFont(font, text)
  }
  catch (error) {
    logger.warn(`Could not subset font \`${url}\`. Falling back to the original font file.`, error)
    return font
  }
}
