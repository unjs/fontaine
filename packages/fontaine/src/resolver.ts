import { readFile } from 'node:fs/promises';
import ofetch from 'ofetch';
import { FontaineFetchError, FontaineInvalidContentTypeError } from './errors.js';

export type ResourceSource = string | Buffer | Uint8Array;

/**
 * Resolves a font resource from a URL or local filesystem.
 */
export async function resolveResource(source: ResourceSource): Promise<Uint8Array> {
  if (source instanceof Buffer || source instanceof Uint8Array) {
    return new Uint8Array(source);
  }

  if (source.startsWith('http')) {
    try {
      const response = await ofetch.raw(source);
      const contentType = response.headers.get('content-type') || '';
      
      if (!contentType.includes('font') && !contentType.includes('application/octet-stream')) {
        throw new FontaineInvalidContentTypeError(contentType);
      }

      const buffer = await response.blob().then(b => b.arrayBuffer());
      return new Uint8Array(buffer);
    } catch (err) {
      if (err instanceof FontaineInvalidContentTypeError) throw err;
      throw new FontaineFetchError(`Failed to fetch remote font: ${source}`);
    }
  }

  try {
    const buffer = await readFile(source);
    return new Uint8Array(buffer);
  } catch (err) {
    throw new FontaineFetchError(`Failed to read local font: ${source}`);
  }
}
