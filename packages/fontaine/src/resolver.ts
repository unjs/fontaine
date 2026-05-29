import { ofetch } from 'ofetch';
import { FontaineFetchError } from './errors.js';
import { readFile } from 'node:fs/promises';

export interface ResolverOptions {
  /** Custom fetch implementation for restricted edge environments */
  fetch?: typeof ofetch;
}

/**
 * Resolves a font source from a URL or local path into a Uint8Array.
 * 
 * @param source - The location of the font file.
 * @param options - Resolver configuration.
 * @returns The raw font binary data.
 * @throws {FontaineFetchError} If the resource cannot be retrieved.
 */
export async function resolveFont(source: string, { fetch = ofetch }: ResolverOptions = {}) {
  if (source.startsWith('http')) {
    try {
      return await fetch(source, { responseType: 'arrayBuffer' }) as Uint8Array;
    } catch (error: any) {
      throw new FontaineFetchError(source, error.response?.status, error.message);
    }
  }

  try {
    const buffer = await readFile(source);
    return new Uint8Array(buffer);
  } catch (error: any) {
    throw new FontaineFetchError(source, 0, `FileSystem error: ${error.message}`);
  }
}
