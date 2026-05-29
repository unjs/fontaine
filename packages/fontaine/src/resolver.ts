import { readFile } from 'node:fs/promises';
import { ofetch } from 'ofetch';
import { isURL } from 'ufo';
import { FontaineFetchError } from './errors.js';

/**
 * Resolves a source identifier into a Uint8Array.
 * Supports remote URLs and local filesystem paths.
 * 
 * @param source - The URL or file path to resolve.
 * @returns A promise resolving to the source buffer.
 * @throws {FontaineFetchError} If the source cannot be retrieved.
 */
export async function resolveSource(source: string): Promise<Uint8Array> {
  try {
    if (isURL(source)) {
      const response = await ofetch(source, {
        responseType: 'arrayBuffer',
      });
      return new Uint8Array(response as ArrayBuffer);
    }

    const buffer = await readFile(source);
    return new Uint8Array(buffer);
  } catch (error: any) {
    throw new FontaineFetchError(
      error.message || 'Failed to resolve font source',
      error.response?.status
    );
  }
}
