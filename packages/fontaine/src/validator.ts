import { FontaineValidationError } from './errors.js';

const VALID_MIME_TYPES = new Set([
  'font/woff',
  'font/woff2',
  'font/otf',
  'font/ttf',
  'application/font-woff',
  'application/font-woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
]);

/**
 * Verifies if the provided content-type is a recognized font format.
 */
export function validateContentType(contentType: string): void {
  if (!contentType || !VALID_MIME_TYPES.has(contentType.toLowerCase())) {
    throw new FontaineValidationError(`Unsupported content-type: ${contentType}`);
  }
}

/**
 * Validates font magic bytes to prevent analysis of non-font binaries.
 */
export function validateMagicBytes(buffer: Uint8Array): void {
  const header = buffer.slice(0, 4);
  const hex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const isWoff2 = hex.startsWith('774f4632'); // wOFF
  const isTtf = hex.startsWith('00010000') || hex.startsWith('774f4646'); // TTF or wOFF
  
  if (!isWoff2 && !isTtf) {
    throw new FontaineValidationError('Binary header does not match known font formats');
  }
}
