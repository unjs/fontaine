import { ValidationError } from './errors.js';

const FONT_MAGIC_BYTES: Record<string, Uint8Array> = {
  woff2: new Uint8Array([0x77, 0x4f, 0x46, 0x32]), // "wOF2"
  ttf: new Uint8Array([0x00, 0x01, 0x00, 0x00]),   // TrueType
  otf: new Uint8Array([0x4f, 0x54, 0x54, 0x4f]),   // "OTTO"
};

const VALID_MIME_TYPES = new Set([
  'font/woff2',
  'font/ttf',
  'font/otf',
  'application/font-woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
]);

/**
 * Validates the source of a font based on MIME type and magic bytes.
 * 
 * @example
 * await validateFont(buffer, 'font/woff2');
 */
export async function validateFont(buffer: Uint8Array, contentType?: string): Promise<void> {
  if (contentType && !VALID_MIME_TYPES.has(contentType)) {
    throw new ValidationError(`Unsupported Content-Type: ${contentType}`);
  }

  const isMagicValid = Object.values(FONT_MAGIC_BYTES).some((magic) => {
    return buffer.slice(0, magic.length).every((byte, i) => byte === magic[i]);
  });

  if (!isMagicValid) {
    throw new ValidationError('Invalid font format: magic bytes do not match known font types.');
  }
}
