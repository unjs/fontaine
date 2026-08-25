import type { Buffer } from 'node:buffer'
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
 * Reduce `font` to the glyphs needed to render `text`, keeping its original format and
 * variation axes.
 *
 * Throws if `subset-font` is not installed: a project that asked for a subset should not
 * silently be given a full font. Fonts harfbuzz cannot process are passed through with a
 * warning instead, as not every format can be subsetted.
 */
export async function subsetFontData(font: Buffer, text: string, url: string): Promise<Buffer> {
  const subsetFont = await loadSubsetter()
  try {
    return await subsetFont(font, text)
  }
  catch (error) {
    logger.warn(`Could not subset font \`${url}\`. Falling back to the original font file.`, error)
    return font
  }
}
