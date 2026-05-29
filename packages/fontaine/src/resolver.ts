import { readFile } from 'node:fs/promises';
import ofetch from 'ofetch';
import { FontaineFetchError } from './errors.js';

export type Source = string | URL | Buffer;

/**
 * Resolves a font source into a Uint8Array.
 * Supports local paths, remote URLs, and raw buffers.
 * 
 * @example
 * const bytes = await resolveSource('https://example.com/font.ttf');
 * const bytes = await resolveSource('./assets/font.woff2');
 * 
 * @param source - The location or raw data of the font.
 * @returns A promise resolving to the font binary as a Uint8Array.
 * @throws {FontaineFetchError} If the source cannot be read.
 */
export async function resolveSource(source: Source): Promise<Uint8Array> {
  if (source instanceof Buffer) {
    return new Uint8Array(source);
  }

  const urlString = source instanceof URL ? source.toString() : source;

  if (urlString.startsWith('http')) {
    try {
      const response = await ofetch.raw(urlString);
      const blob = await response.blob();
      return new Uint8Array(await blob.arrayBuffer());
    } catch (error) {
      throw new FontaineFetchError(urlString, error);
    }
  }

  try {
    const buffer = await readFile(urlString);
    return new Uint8Array(buffer);
  } catch (error) {
    throw new FontaineFetchError(urlString, error);
  }
}
