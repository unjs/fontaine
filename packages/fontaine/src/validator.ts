import { FontaineValidationError } from './errors.js';

const SUPPORTED_FONT_MIME_TYPES = new Set([
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/font-ttf',
  'application/font-otf',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/vnd.ms-fontobject',
]);

/**
 * Validates that a given mime-type is a supported font format.
 * 
 * @param mimeType - The content-type string to validate.
 * @throws {FontaineValidationError} If the mime-type is not supported.
 */
export function validateFontMimeType(mimeType: string): void {
  if (!SUPPORTED_FONT_MIME_TYPES.has(mimeType.toLowerCase())) {
    throw new FontaineValidationError(`Unsupported font mime-type: ${mimeType}`);
  }
}

/**
 * Validates that the provided buffer is not empty.
 * 
 * @param buffer - The font buffer to validate.
 * @throws {FontaineValidationError} If the buffer is empty.
 */
export function validateFontBuffer(buffer: Buffer): void {
  if (!buffer || buffer.length === 0) {
    throw new FontaineValidationError('Font buffer is empty or undefined');
  }
}
