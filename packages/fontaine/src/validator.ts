import { FontaineValidationError } from './errors.js';

const FONT_MIME_TYPES = [
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/font-ttf',
  'application/font-otf',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/vnd.ms-fontobject',
];

/**
 * Validates that the provided buffer corresponds to a known font format.
 */
export function validateFontBuffer(buffer: Uint8Array): void {
  if (buffer.length < 4) {
    throw new FontaineValidationError('Buffer too small to be a valid font');
  }

  const magicBytes = Array.from(buffer.slice(0, 4))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const isValid = [
    '00010000', // TrueType
    '4f54544f', // OpenType
    '774f4632', // WOFF2
    '774f4631', // WOFF1
  ].includes(magicBytes);

  if (!isValid) {
    throw new FontaineValidationError('Unsupported or invalid font binary signatures');
  }
}
