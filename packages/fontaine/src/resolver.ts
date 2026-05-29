import { readFile } from 'node:fs/promises';
import ofetch from 'ofetch';
import { FontaineFetchError, FontaineInvalidContentTypeError } from './errors.js';

export interface FontBuffer {
  buffer: Buffer;
  mimeType: string;
  source: string;
}

/**
 * Handles resolution of font sources from local paths, URLs, or raw buffers.
 */
export class FontSourceResolver {
  private readonly ALLOWED_MIME_TYPES = [
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2',
    'application/x-font-ttf',
    'application/x-font-otf',
    'application/font-woff',
    'application/font-woff2',
  ];

  /**
   * Resolves a given input into a standardized FontBuffer.
   * 
   * @example
   * const resolver = new FontSourceResolver();
   * const font = await resolver.resolve('https://example.com/font.ttf');
   * 
   * @throws {FontaineFetchError} If the resource cannot be reached.
   * @throws {FontaineInvalidContentTypeError} If the resource is not a font.
   */
  async resolve(input: string | Buffer): Promise<FontBuffer> {
    if (Buffer.isBuffer(input)) {
      return {
        buffer: input,
        mimeType: 'application/octet-stream',
        source: 'buffer',
      };
    }

    if (this.isUrl(input)) {
      return this.resolveUrl(input);
    }

    return this.resolveLocalFile(input);
  }

  private isUrl(input: string): boolean {
    return input.startsWith('http://') || input.startsWith('https://');
  }

  private async resolveUrl(url: string): Promise<FontBuffer> {
    try {
      const response = await ofetch.raw(url, {
        responseType: 'arrayBuffer',
      });

      const contentType = response.headers.get('content-type')?.split(';')[0] || '';

      if (!this.ALLOWED_MIME_TYPES.includes(contentType)) {
        throw new FontaineInvalidContentTypeError(url, contentType);
      }

      return {
        buffer: Buffer.from(response._data),
        mimeType: contentType,
        source: url,
      };
    } catch (error) {
      if (error instanceof FontaineInvalidContentTypeError) throw error;
      throw new FontaineFetchError(error instanceof Error ? error.message : 'Unknown network error', url);
    }
  }

  private async resolveLocalFile(path: string): Promise<FontBuffer> {
    try {
      const buffer = await readFile(path);
      return {
        buffer,
        mimeType: 'application/octet-stream',
        source: path,
      };
    } catch (error) {
      throw new FontaineFetchError(error instanceof Error ? error.message : 'File read error', path);
    }
  }
}
