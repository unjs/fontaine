import { ValidationError } from './errors.js';

const FONT_MIME_TYPES = [
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/font-ttf',
  'application/font-otf',
  'application/font-woff',
  'application/font-woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/x-font-woff',
  'application/x-font-woff2',
];

/**
 * Validates the Content-Type of a response to ensure it is a font asset.
 * 
 * @param mimeType - The mime-type string to validate.
 * @throws {ValidationError} If the mime-type is not in the permitted list.
 * @returns {boolean} True if valid.
 */
export function validateFontMime(mimeType: string): boolean {
  const isFont = FONT_MIME_TYPES.some((type) => mimeType.toLowerCase().includes(type));
  if (!isFont) {
    throw new ValidationError(mimeType);
  }
  return true;
}
