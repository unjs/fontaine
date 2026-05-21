import { ofetch } from 'ofetch';
import { readFile } from 'node:fs/promises';
import { FontaineFetchError } from './errors.js';

type ResourceCache = Map<string, Promise<Uint8Array>>;

const cache: ResourceCache = new Map();

/**
 * Resolves a font resource from local filesystem or remote URL.
 * Implements Promise-based memoization to coalesce concurrent requests.
 */
export async function resolveFont(url: string): Promise<Uint8Array> {
  if (cache.has(url)) {
    return cache.get(url)!;
  }

  const request = (async () => {
    try {
      if (url.startsWith('http')) {
        const response = await ofetch(url, {
          responseType: 'arrayBuffer',
          onResponse({ response }) {
            const contentType = response.headers.get('content-type');
            const isFont = contentType?.includes('font') || 
                           contentType?.includes('application/octet-stream');
            
            if (!isFont) {
              throw new FontaineFetchError(url, response.status, `Invalid Content-Type: ${contentType}`);
            }
          },
        });
        return new Uint8Array(response as ArrayBuffer);
      }

      return new Uint8Array(await readFile(url));
    } catch (err) {
      if (err instanceof FontaineFetchError) throw err;
      throw new FontaineFetchError(url, 0, err instanceof Error ? err.message : 'Unknown resolution error');
    }
  })();

  cache.set(url, request);
  return request;
}
