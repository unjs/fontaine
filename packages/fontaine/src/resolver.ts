import { readFile } from 'node:fs/promises';
import ofetch from 'ofetch';
import { FontaineFetchError } from './errors.js';

/**
 * Resolves a font source from either a local filesystem path or a remote URL.
 * Validates that the content type is a font asset.
 * 
 * @param source - The local path or URL to the font file.
 * @returns A Uint8Array containing the font binary data.
 * @throws {FontaineFetchError} If the source is unreachable or invalid.
 */
export async function resolveFontSource(source: string): Promise<Uint8Array> {
  if (source.startsWith('http')) {
    try {
      const response = await ofetch.raw(source);
      const contentType = response.headers.get('content-type') || '';
      
      if (!contentType.includes('font') && !contentType.includes('application/octet-stream')) {
        throw new FontaineFetchError(`Invalid Content-Type: ${contentType}`);
      }
      
      const buffer = await response.blob().then(b => b.arrayBuffer());
      return new Uint8Array(buffer);
    } catch (err) {
      throw new FontaineFetchError(err instanceof Error ? err.message : 'Unknown network error');
    }
  }

  try {
    const buffer = await readFile(source);
    return new Uint8Array(buffer);
  } catch (err) {
    throw new FontaineFetchError(err instanceof Error ? err.message : 'File system read error');
  }
}
