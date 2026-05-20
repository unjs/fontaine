import { FontaineInvalidContentTypeError } from './errors.js';

const FONT_SIGNATURES = [
  { mime: 'font/ttf', magic: [0x00, 0x01, 0x00, 0x00] },
  { mime: 'font/otf', magic: [0x00, 0x01, 0x00, 0x00] }, // Simplified for demo
  { mime: 'font/woff', magic: [0x77, 0x4F, 0x46, 0x32] }, // WOFF2
  { mime: 'font/woff', magic: [0x77, 0x4F, 0x46, 0x01] }, // WOFF
];

/**
 * Validates that a buffer starts with a recognized font binary signature.
 * @throws {FontaineInvalidContentTypeError} If no matching signature is found.
 */
export function validateFontBinary(buffer: Uint8Array, source: string): void {
  const signature = buffer.slice(0, 4);
  const isValid = FONT_SIGNATURES.some(sig => 
    sig.magic.every((byte, i) => signature[i] === byte)
  );

  if (!isValid) {
    throw new FontaineInvalidContentTypeError(source, 'unknown/binary');
  }
}
