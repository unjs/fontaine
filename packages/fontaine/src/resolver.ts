import { ofetch, FetchResponse } from 'ofetch';
import fs from 'node:fs/promises';
import { FetchError, InvalidSourceError } from './errors';

export class FontResolver {
  /**
   * Resolves a font source (URL or local path) into a Uint8Array.
   * 
   * @param source - The location of the font file.
   * @returns A promise resolving to the font binary data.
   * @throws {InvalidSourceError} If the source format is unsupported.
   * @throws {FetchError} If the resource cannot be retrieved.
   */
  async resolve(source: string): Promise<Uint8Array> {
    if (this.isRemote(source)) {
      return this.resolveRemote(source);
    }
    return this.resolveLocal(source);
  }

  private isRemote(source: string): boolean {
    return source.startsWith('http://') || source.startsWith('https://');
  }

  private async resolveRemote(source: string): Promise<Uint8Array> {
    try {
      const response = await ofetch.raw(source, {
        responseType: 'arrayBuffer',
      });

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('font') && !contentType.includes('application/octet-stream')) {
        throw new InvalidSourceError(`Unsupported content-type: ${contentType}`);
      }

      return new Uint8Array(response._data as ArrayBuffer);
    } catch (error) {
      if (error instanceof InvalidSourceError) throw error;
      throw new FetchError(`Failed to fetch remote font: ${source}`, (error as any).status);
    }
  }

  private async resolveLocal(source: string): Promise<Uint8Array> {
    try {
      const buffer = await fs.readFile(source);
      return new Uint8Array(buffer);
    } catch (error) {
      throw new FetchError(`Failed to read local font file: ${source}`);
    }
  }
}
