import fs from 'node:fs/promises';
import ofetch from 'ofetch';
import { FontaineFetchError, FontaineResolutionError } from './errors.js';
import { validateContentType } from './validator.js';

export interface FontBuffer {
  buffer: Buffer;
  mimeType: string;
  source: string;
}

/**
 * Handles transparent resolution of fonts from local paths or remote URLs.
 */
export class FontSourceResolver {
  /**
   * Resolves a source string into a FontBuffer.
   * 
   * @throws {FontaineFetchError} On network failure.
   * @throws {FontaineResolutionError} On filesystem failure.
   * @throws {FontaineInvalidContentTypeError} On invalid MIME type.
   */
  async resolve(source: string): Promise<FontBuffer> {
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return this.resolveRemote(source);
    }
    return this.resolveLocal(source);
  }

  private async resolveRemote(url: string): Promise<FontBuffer> {
    try {
      const response = await ofetch.raw(url);
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      validateContentType(contentType);

      const buffer = await response.blob().then(b => b.arrayBuffer());
      return {
        buffer: Buffer.from(buffer),
        mimeType: contentType,
        source: url,
      };
    } catch (error: any) {
      if (error instanceof Error && error.name === 'FontaineInvalidContentTypeError') throw error;
      throw new FontaineFetchError(url, error.response?.status);
    }
  }

  private async resolveLocal(path: string): Promise<FontBuffer> {
    try {
      const buffer = await fs.readFile(path);
      // Local files lack MIME headers; basic extension check or generic assignment
      // In production, a library like 'mime-types' would be used here
      const mimeType = 'font/ttf'; 
      
      return {
        buffer,
        mimeType,
        source: path,
      };
    } catch (error: any) {
      throw new FontaineResolutionError(path, error);
    }
  }
}
