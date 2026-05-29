import { FontaineInvalidContentTypeError } from './errors.js';
import { ofetch } from 'ofetch';

const ALLOWED_MIME_TYPES = [
  'font/ttf',
  'font/otf',
  'application/x-font-ttf',
  'application/x-font-opentype',
  'application/font-sfnt',
];

/**
 * Validates the MIME type of a remote resource to ensure it is a font.
 * 
 * @param url - The resource URL to analyze.
 * @param fetchClient - The fetch implementation to use for the HEAD request.
 * @throws {FontaineInvalidContentTypeError} If the content-type is not a recognized font type.
 */
export async function analyzeUrl(url: string, fetchClient = ofetch) {
  const response = await fetchClient(url, { method: 'HEAD' });
  const contentType = response.headers.get('content-type')?.split(';')[0] || '';

  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new FontaineInvalidContentTypeError(contentType, ALLOWED_MIME_TYPES);
  }

  return { contentType };
}
