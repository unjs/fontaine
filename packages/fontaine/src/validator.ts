import { FontaineInvalidContentTypeError } from './errors.js';

const ALLOWED_MIME_TYPES = new Set([
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/font-woff',
  'application/font-woff2',
]);

/**
 * Validates that the provided content type is a supported font format.
 * 
 * @throws {FontaineInvalidContentTypeError} If the MIME type is unsupported.
 */
export function validateContentType(contentType: string): void {
  if (!ALLOWED_MIME_TYPES.has(contentType.toLowerCase())) {
    throw new FontaineInvalidContentTypeError(contentType);
  }
}
