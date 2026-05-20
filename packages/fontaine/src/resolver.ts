import { fetch } from 'ofetch';
import { readFile } from 'node:fs/promises';
import { FontaineFetchError } from './errors.js';

export interface FontSourceResolver {
  resolve(source: string): Promise<Uint8Array>;
}

/**
 * Resolves font data from either a remote URL or a local file system path.
 */
export class DefaultFontSourceResolver implements FontSourceResolver {
  async resolve(source: string): Promise<Uint8Array> {
    try {
      if (source.startsWith('http://') || source.startsWith('https://')) {
        const response = await fetch(source, { responseType: 'arrayBuffer' });
        return new Uint8Array(response as ArrayBuffer);
      }
      
      const buffer = await readFile(source);
      return new Uint8Array(buffer);
    } catch (error) {
      throw new FontaineFetchError(`Failed to resolve font source at ${source}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
