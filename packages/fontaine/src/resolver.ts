import { ofetch } from 'ofetch';
import fs from 'node:fs/promises';
import { FontaineFetchError } from './errors.js';

/**
 * Resolves a font source from a URL or local path into a Uint8Array.
 * @param source - The URI or file path to the font.
 * @returns A Uint8Array containing the font binary.
 * @throws {FontaineFetchError} If the source cannot be retrieved.
 */
export async function resolveFontSource(source: string): Promise<Uint8Array> {
  try {
    if (source.startsWith('http://') || source.startsWith('https://')) {
      const response = await ofetch(source, { responseType: 'arrayBuffer' });
      return new Uint8Array(response as ArrayBuffer);
    }

    const buffer = await fs.readFile(source);
    return new Uint8Array(buffer);
  } catch (error: any) {
    throw new FontaineFetchError(`Failed to resolve font source: ${error.message}`);
  }
}
