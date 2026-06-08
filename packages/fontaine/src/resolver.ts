import { ofetch } from 'ofetch';
import { FontaineFetchError, FontaineInvalidContentTypeError } from './errors.js';
import { readFile } from 'node:fs/promises';

const VALID_FONT_MIME_TYPES = new Set([
  'font/woff2',
  'font/woff',
  'application/font-woff',
  'application/x-font-ttf',
  'application/font-otf',
  'application/x-font-otf',
]);

/**
 * Resolves a source (URL or local path) into an ArrayBuffer.
 * 
 * @throws {FontaineFetchError} If the resource is unreachable.
 * @throws {FontaineInvalidContentTypeError} If the response is not a font.
 */
export async function resolveFontSource(source: string): Promise<ArrayBuffer> {
  if (source.startsWith('http')) {
    try {
      const response = await ofetch.raw(source, {
        responseType: 'arrayBuffer',
      });

      const contentType = response.headers.get('content-type')?.split(';')[0];
      if (!contentType || !VALID_FONT_MIME_TYPES.has(contentType)) {
        throw new FontaineInvalidContentTypeError(contentType);
      }

      return response._data as ArrayBuffer;
    } catch (err) {
      if (err instanceof FontaineInvalidContentTypeError) throw err;
      throw new FontaineFetchError(err instanceof Error ? err.message : 'Unknown network error');
    }
  }

  try {
    const buffer = await readFile(source);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  } catch (err) {
    throw new FontaineFetchError(err instanceof Error ? err.message : 'Local file read error');
  }
}
