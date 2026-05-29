import { ofetch } from 'ofetch';
import { ufo } from 'ufo';
import { readFile } from 'node:fs/promises';
import { FontaineNetworkError, FontaineFileSystemError } from './errors.js';

/**
 * Handles retrieval of font data from various protocols (http, https, file).
 */
export class FontResolver {
  /**
   * Resolves a source string into a Uint8Array.
   * 
   * @param source - The URL or file path to the font.
   * @throws {FontaineNetworkError} if network request fails.
   * @throws {FontaineFileSystemError} if file access fails.
   * @returns A promise resolving to the font data as a Uint8Array.
   */
  async resolve(source: string): Promise<Uint8Array> {
    const url = ufo.stringify(source);

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return this.resolveRemote(url);
    }

    return this.resolveLocal(source);
  }

  private async resolveRemote(url: string): Promise<Uint8Array> {
    try {
      const response = await ofetch(url, {
        responseType: 'arrayBuffer',
      });
      return new Uint8Array(response as ArrayBuffer);
    } catch (err: any) {
      throw new FontaineNetworkError(
        `Failed to fetch font from ${url}: ${err.message}`,
        err.response?.status
      );
    }
  }

  private async resolveLocal(path: string): Promise<Uint8Array> {
    try {
      const buffer = await readFile(path);
      return new Uint8Array(buffer);
    } catch (err: any) {
      throw new FontaineFileSystemError(
        `Failed to read font file at ${path}: ${err.message}`
      );
    }
  }
}
