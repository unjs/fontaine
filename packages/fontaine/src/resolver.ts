import { readFile } from 'node:fs/promises';
import { ofetch } from 'ofetch';
import { FetchError, FileSystemError } from './errors.js';

export interface SourceResolver {
  resolve(source: string): Promise<Uint8Array>;
}

export class FontSourceResolver implements SourceResolver {
  async resolve(source: string): Promise<Uint8Array> {
    if (source.startsWith('http')) {
      try {
        return await ofetch(source, { responseType: 'arrayBuffer' }) as Uint8Array;
      } catch (err: any) {
        throw new FetchError(`Failed to fetch font from ${source}: ${err.message}`);
      }
    }

    try {
      return new Uint8Array(await readFile(source));
    } catch (err: any) {
      throw new FileSystemError(`Failed to read font file at ${source}: ${err.message}`);
    }
  }
}
