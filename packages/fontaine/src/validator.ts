import { FontaineValidationError } from './errors.js';

const ALLOWED_MIME_TYPES = [
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/font-sfnt',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/vnd.ms-fontobject',
];

/**
 * Validates that the provided buffer is likely a font file.
 * 
 * @param bytes - The binary data to validate.
 * @param contentType - Optional MIME type from HTTP headers.
 * @throws {FontaineValidationError} If validation fails.
 */
export function validateFontBinary(bytes: Uint8Array, contentType?: string): void {
  if (contentType && !ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new FontaineValidationError('remote-source', contentType);
  }

  // Basic magic number check for TTF/OTF/WOFF
  // TTF/OTF start with 00 01 00 00 or wOFF (77 6F 46 46)
  const header = bytes.slice(0, 4);
  const isTtf = header[0] === 0x00 && header[1] === 0x01 && header[2] === 0x00 && header[3] === 0x00;
  const isWoff = header[0] === 0x77 && header[1] === 0x6F && header[2] === 0x46 && header[3] === 0x46;

  if (!isTtf && !isWoff) {
    throw new FontaineValidationError('binary-buffer');
  }
}
