import { ValidationError } from './errors.js';

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
 * Validates the MIME-type of a font asset against a strict whitelist.
 * @throws {ValidationError} If the MIME-type is not recognized as a font.
 */
export function validateMimeType(mime: string): void {
  if (!ALLOWED_MIME_TYPES.has(mime.toLowerCase())) {
    throw new ValidationError(`Unsupported MIME-type: ${mime}`, mime);
  }
}
