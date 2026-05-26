import { readFile } from 'node:fs/promises';
import { ofetch } from 'ofetch';
import { isAbsolute } from 'ufo';
import { FontaineFetchError } from './errors.js';

export interface FontResolver {
  resolve(url: string): Promise<Uint8Array>;
}

/**
 * Resolves fonts from the local file system.
 */
export class LocalResolver implements FontResolver {
  async resolve(path: string): Promise<Uint8Array> {
    try {
      return new Uint8Array(await readFile(path));
    } catch (err) {
      throw new FontaineFetchError(path, err);
    }
  }
}

/**
 * Resolves fonts from remote HTTPS endpoints.
 */
export class RemoteResolver implements FontResolver {
  async resolve(url: string): Promise<Uint8Array> {
    try {
      return await ofetch(url, {
        responseType: 'arrayBuffer',
      }) as unknown as Uint8Array;
    } catch (err) {
      throw new FontaineFetchError(url, err);
    }
  }
}

/**
 * Factory to determine the appropriate resolver based on the input URI.
 */
export function createResolver(url: string): FontResolver {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return new RemoteResolver();
  }
  return new LocalResolver();
}
