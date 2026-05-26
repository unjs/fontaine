import { readFileSync } from 'node:fs';
import ofetch from 'ofetch';
import { FontaineFetchError } from './errors.js';

export interface ResolveResult {
  buffer: Buffer;
  contentType: string;
}

/**
 * Abstracts the retrieval of font binaries from local or remote sources.
 */
export class FontResolver {
  /**
   * Resolves a font asset into a binary buffer.
   * @example
   * const resolver = new FontResolver();
   * const { buffer } = await resolver.resolve('https://example.com/font.woff2');
   * @param source Path or URL to the font asset.
   * @throws {FontaineFetchError} If the asset cannot be retrieved.
   */
  async resolve(source: string): Promise<ResolveResult> {
    if (source.startsWith('http')) {
      return this.resolveRemote(source);
    }
    return this.resolveLocal(source);
  }

  private async resolveRemote(url: string): Promise<ResolveResult> {
    try {
      const response = await ofetch.raw(url, { responseType: 'arrayBuffer' });
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      return {
        buffer: Buffer.from(await response.blob().arrayBuffer()),
        contentType,
      };
    } catch (error) {
      throw new FontaineFetchError(url, error);
    }
  }

  private resolveLocal(path: string): Promise<ResolveResult> {
    try {
      const buffer = readFileSync(path);
      return Promise.resolve({
        buffer,
        contentType: 'application/x-font-ttf', // Default for local files
      });
    } catch (error) {
      throw new FontaineFetchError(path, error);
    }
  }
}
