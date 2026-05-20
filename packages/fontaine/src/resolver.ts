import { readFileSync } from 'node:fs';
import { ofetch } from 'ofetch';
import { FontaineFetchError } from './errors.js';
import { validateFontMimeType } from './validator.js';

/**
 * Strategy for resolving font assets from various sources.
 */
export class FontResolver {
  /**
   * Resolves a font from a URL or local file path.
   * 
   * @param source - The URI of the font asset.
   * @returns A promise resolving to the font buffer.
   * @throws {FontaineFetchError} If the asset cannot be retrieved or validated.
   */
  async resolve(source: string): Promise<Buffer> {
    if (source.startsWith('http')) {
      return this.fetchRemote(source);
    }
    return this.fetchLocal(source);
  }

  private async fetchRemote(url: string): Promise<Buffer> {
    try {
      const response = await ofetch.raw(url, {
        responseType: 'arrayBuffer',
      });

      const contentType = response.headers.get('content-type') || '';
      validateFontMimeType(contentType);

      return Buffer.from(response._data as ArrayBuffer);
    } catch (error: any) {
      throw new FontaineFetchError(
        error instanceof Error ? error.message : 'Unknown network error',
        url
      );
    }
  }

  private fetchLocal(path: string): Buffer {
    try {
      return readFileSync(path);
    } catch (error: any) {
      throw new FontaineFetchError(
        `Failed to read local font at ${path}: ${error.message}`,
        path
      );
    }
  }
}
