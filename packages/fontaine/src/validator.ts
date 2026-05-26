import { FontaineInvalidContentTypeError, FontaineValidationError } from './errors.js';

const ALLOWED_MIME_TYPES = new Set([
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/font-ttf',
  'application/font-otf',
  'application/vnd.ms-fontobject',
  'application/x-font-ttf',
  'application/x-font-otf',
]);

/**
 * Verifies that the binary data corresponds to a valid font asset.
 */
export class FontValidator {
  /**
   * Validates the content type and binary headers.
   * @param contentType The MIME type reported by the transport layer.
   * @param buffer The raw binary data of the asset.
   * @throws {FontaineInvalidContentTypeError} If MIME type is unsupported.
   * @throws {FontaineValidationError} If binary headers are invalid.
   */
  validate(contentType: string, buffer: Buffer): void {
    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      throw new FontaineInvalidContentTypeError(contentType);
    }

    if (!this.verifyMagicNumbers(buffer)) {
      throw new FontaineValidationError('Invalid font binary signature');
    }
  }

  private verifyMagicNumbers(buffer: Buffer): boolean {
    // Check for common font signatures: WOFF2, WOFF, TTF/OTF
    const magic = buffer.slice(0, 4).toString('hex');
    const signatures = [
      '774f4632', // wOFF2
      '774f4631', // wOFF
      '00010000', // TTF
      '4f54544f', // OTF
    ];
    return signatures.some((sig) => magic.startsWith(sig));
  }
}
