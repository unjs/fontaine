import fs from 'node:fs/promises';
import { ofetch } from 'ofetch';
import { FontaineNetworkError, FontaineInvalidAssetError } from './errors.js';

const ALLOWED_FONT_MIME_TYPES = new Set([
  'font/woff',
  'font/woff2',
  'application/font-woff',
  'application/x-font-ttf',
  'font/ttf',
  'application/octet-stream',
]);

/**
 * Resolves a font source (local path or remote URL) into a Buffer.
 */
export class FontSourceResolver {
  /**
   * Resolves the provided source into a binary buffer.
   * 
   * @param source - The file system path or URL of the font asset.
   * @returns A promise resolving to the font buffer.
   * @throws {FontaineNetworkError} If the remote request fails.
   * @throws {FontaineInvalidAssetError} If the MIME type is not in the whitelist.
   */
  async resolve(source: string): Promise<Buffer> {
    if (this.isRemote(source)) {
      return this.resolveRemote(source);
    }
    return this.resolveLocal(source);
  }

  private isRemote(source: string): boolean {
    return source.startsWith('http://') || source.startsWith('https://');
  }

  private async resolveLocal(source: string): Promise<Buffer> {
    try {
      return fs.readFileSync(source);
    } catch (error) {
      throw new FontaineInvalidAssetError(source, `Unable to read local file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async resolveRemote(source: string): Promise<Buffer> {
    try {
      const response = await ofetch.raw(source);
      const contentType = response.headers.get('content-type')?.split(';')[0];

      if (!contentType || !ALLOWED_FONT_MIME_TYPES.has(contentType)) {
        throw new FontaineInvalidAssetError(source, `Unsupported MIME type: ${contentType}`);
      }

      const buffer = await response.blob().then(blob => blob.arrayBuffer());
      return Buffer.from(buffer);
    } catch (error) {
      if (error instanceof FontaineInvalidAssetError) throw error;
      
      const status = (error as any).response?.status || 500;
      throw new FontaineNetworkError(source, status, error instanceof Error ? error.message : 'Unknown network error');
    }
  }
}
