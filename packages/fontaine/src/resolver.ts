import { readFileSync } from 'node:fs';
import ofetch from 'ofetch';
import { FetchError } from './errors.js';

export interface SourceResolver {
  resolve(source: string): Promise<Uint8Array>;
}

/**
 * Handles remote font retrieval with strict MIME-type validation.
 * This prevents the analysis engine from attempting to process HTML error pages
 * returned as 200 OK.
 */
export class RemoteResolver implements SourceResolver {
  async resolve(url: string): Promise<Uint8Array> {
    try {
      const response = await ofetch.raw(url, { responseType: 'arrayBuffer' });
      const contentType = response.headers.get('content-type');

      if (!contentType || !contentType.startsWith('font/') && !contentType.includes('application/x-font')) {
        throw new FetchError(`Invalid MIME type: ${contentType}. Expected a font binary.`);
      }

      return new Uint8Array(response._data);
    } catch (err) {
      if (err instanceof FetchError) throw err;
      throw new FetchError(`Failed to fetch font from ${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

/**
 * Handles local filesystem font retrieval.
 */
export class LocalResolver implements SourceResolver {
  async resolve(path: string): Promise<Uint8Array> {
    try {
      const buffer = readFileSync(path);
      return new Uint8Array(buffer);
    } catch (err) {
      throw new FetchError(`Failed to read local file ${path}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export function createResolver(source: string): SourceResolver {
  return source.startsWith('http') ? new RemoteResolver() : new LocalResolver();
}
