import { readFile } from 'node:fs/promises';
import ofetch from 'ofetch';
import { FontaineFetchError } from './errors.js';

/**
 * Defines a strategy for resolving a source string into a binary buffer.
 */
export interface ResourceResolver {
  /**
   * Resolves the given source into a Uint8Array.
   * @throws {FontaineFetchError} If the resource cannot be retrieved.
   */
  resolve(source: string): Promise<Uint8Array>;
}

/**
 * Resolves resources from the local filesystem.
 */
export class FileResolver implements ResourceResolver {
  async resolve(source: string): Promise<Uint8Array> {
    try {
      const buffer = await readFile(source);
      return new Uint8Array(buffer);
    } catch (error) {
      throw new FontaineFetchError(source, error);
    }
  }
}

/**
 * Resolves resources from remote HTTP/HTTPS endpoints.
 */
export class UrlResolver implements ResourceResolver {
  async resolve(source: string): Promise<Uint8Array> {
    try {
      return await ofetch(source, { responseType: 'arrayBuffer' }) as unknown as Uint8Array;
    } catch (error) {
      throw new FontaineFetchError(source, error);
    }
  }
}

/**
 * Factory to determine the appropriate resolver based on the source URI.
 */
export function createResolver(source: string): ResourceResolver {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    return new UrlResolver();
  }
  return new FileResolver();
}
