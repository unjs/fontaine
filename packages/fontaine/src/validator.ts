import { ValidationError } from './errors.js';

/**
 * Validates that a buffer contains a valid font file (TTF/OTF).
 * Checks for common font magic numbers.
 * 
 * @param fontBuffer - The raw buffer to validate.
 * @throws {ValidationError} If the buffer is not a recognized font format.
 */
export function validateFontBuffer(fontBuffer: Uint8Array): void {
  if (fontBuffer.length < 4) {
    throw new ValidationError('Font buffer is too small to be a valid font file.');
  }

  const magic = Array.from(fontBuffer.slice(0, 4))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // TTF: 00 01 00 00 | OTF: OTTO
  const isTtf = magic === '00010000';
  const isOtf = magic === '4f54544f'; // "OTTO" in hex

  if (!isTtf && !isOtf) {
    throw new ValidationError(`Unsupported font format. Magic bytes: ${magic}`);
  }
}

/**
 * Validates the Content-Type header of a remote asset.
 * 
 * @param contentType - The header value to check.
 * @throws {ValidationError} If the content type is not a font.
 */
export function validateContentType(contentType: string | null): void {
  const fontTypes = ['font/ttf', 'font/otf', 'application/x-font-ttf', 'application/font-sfnt'];
  if (!contentType || !fontTypes.includes(contentType.toLowerCase())) {
    throw new ValidationError(`Invalid Content-Type: ${contentType}. Expected one of ${fontTypes.join(', ')}`);
  }
}
