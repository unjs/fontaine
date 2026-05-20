import fs from 'node:fs/promises';
import { ofetch } from 'ofetch';
import { FontaineFetchError, FontaineInvalidContentTypeError } from './errors.js';

const VALID_FONT_MIME_TYPES = new Set([
  'font/woff2',
  'font/woff',
  'font/ttf',
  'application/font-woff',
  'application/x-font-ttf',
  'application/font-sfnt',
]);

/**
 * Resolves a font source (local path or HTTPS URL) into a Buffer.
 * 
 * @throws FontaineFetchError if the network request fails.
 * @throws FontaineInvalidContentTypeError if the response is not a font.
 * @throws FontaineError for file system access issues.
 */
export async function resolveFontSource(source: string): Promise<Buffer> {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    try {
      const response = await ofetch(source, {
        responseType: 'arrayBuffer',
      });

      // ofetch doesn't return headers in the response body by default 
      // when using responseType: 'arrayBuffer' in some versions, 
      // so we use a raw fetch call for header validation.
      const head = await ofetch(source, { method: 'HEAD' });
      const contentType = head.headers.get('content-type');

      if (!contentType || !VALID_FONT_MIME_TYPES.has(contentType)) {
        throw new FontaineInvalidContentTypeError(contentType || 'unknown');
      }

      return Buffer.from(response as ArrayBuffer);
    } catch (error) {
      if (error instanceof FontaineInvalidContentTypeError) throw error;
      throw new FontaineFetchError(source, error);
    }
  }

  try {
    const buffer = await fs.readFile(source);
    return buffer;
  } catch (error) {
    throw new FontaineError(`Local file read failed: ${source}`);
  }
}
