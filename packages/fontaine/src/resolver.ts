import { ofetch } from 'ofetch';
import { FetchError, InvalidContentTypeError } from './errors';
import { readFile } from 'node:fs/promises';

/**
 * Resolves a font source from a URL or local file path.
 * 
 * @param source - The URI of the font (https:// or file://).
 * @returns The binary content of the font.
 * @throws {FetchError} If the resource is unreachable.
 * @throws {InvalidContentTypeError} If the response is not a font.
 */
export async function resolveFontSource(source: string): Promise<Uint8Array> {
  if (source.startsWith('file://')) {
    try {
      const path = source.replace('file://', '');
      const buffer = await readFile(path);
      return new Uint8Array(buffer);
    } catch (error) {
      throw new FetchError(`Failed to read local file: ${source}`);
    }
  }

  try {
    const response = await ofetch.raw(source, {
      responseType: 'arrayBuffer',
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('font')) {
      throw new InvalidContentTypeError(contentType);
    }

    return new Uint8Array(response._data);
  } catch (error) {
    if (error instanceof InvalidContentTypeError) throw error;
    throw new FetchError(`Failed to fetch font from ${source}`);
  }
}
