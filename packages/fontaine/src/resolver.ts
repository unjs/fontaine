import { readFileSync } from 'node:fs';
import { ofetch } from 'ofetch';
import { FetchError } from './errors.js';

/**
 * Handles resource resolution from local paths or remote URLs.
 */
export class Resolver {
  /**
   * Resolves a source string into a font buffer.
   * @throws {FetchError} If the resource cannot be retrieved or content-type is invalid.
   */
  async resolve(source: string): Promise<Uint8Array> {
    if (source.startsWith('http')) {
      return this.resolveRemote(source);
    }
    return this.resolveLocal(source);
  }

  private async resolveRemote(url: string): Promise<Uint8Array> {
    try {
      const response = await ofetch.raw(url, {
        responseType: 'arrayBuffer',
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('font')) {
        throw new FetchError(`Invalid Content-Type: ${contentType}. Expected font mime-type.`);
      }

      return new Uint8Array(response._data);
    } catch (error: any) {
      if (error instanceof FetchError) throw error;
      throw new FetchError(error.message || 'Failed to fetch remote font', error.status);
    }
  }

  private resolveLocal(path: string): Uint8Array {
    try {
      return new Uint8Array(readFileSync(path));
    } catch (error: any) {
      throw new FetchError(`Filesystem access denied or file not found: ${path}`);
    }
  }
}
