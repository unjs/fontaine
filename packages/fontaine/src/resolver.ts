import { readFileSync } from 'node:fs';
import { ofetch } from 'ofetch';
import { FontaineFetchError, FontaineInvalidContentTypeError } from './errors.js';

const ALLOWED_MIME_TYPES = [
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/font-sfnt',
];

/**
 * Resolves a font asset from either a local file system path or a remote HTTPS URL.
 * 
 * @param source - The path or URL to the font asset.
 * @returns A Buffer containing the font binary data.
 * @throws {FontaineFetchError} If the asset cannot be retrieved.
 * @throws {FontaineInvalidContentTypeError} If the asset is not a recognized font type.
 */
export async function resolveFontSource(source: string): Promise<Buffer> {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    try {
      const response = await ofetch.raw(source);
      const contentType = response.headers.get('content-type');

      if (!contentType || !ALLOWED_MIME_TYPES.some(type => contentType.includes(type))) {
        throw new FontaineInvalidContentTypeError(contentType || 'unknown');
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (error instanceof FontaineInvalidContentTypeError) throw error;
      throw new FontaineFetchError(source, error);
    }
  }

  try {
    return readFileSync(source);
  } catch (error) {
    throw new FontaineFetchError(source, error);
  }
}
