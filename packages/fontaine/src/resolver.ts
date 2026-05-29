import { ufo } from 'ufo';
import { ofetch } from 'ofetch';
import { FontaineFetchError } from './errors.js';
import { validateContentType } from './validator.js';

export interface ResolverOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Resolves a font asset from a local path or remote URL.
 */
export async function resolveFont(url: string, options: ResolverOptions = {}): Promise<Uint8Array> {
  const normalizedUrl = ufo(url);
  
  try {
    const response = await ofetch.raw(normalizedUrl, {
      method: 'GET',
      headers: options.headers,
      timeout: options.timeout,
    });

    const contentType = response.headers.get('content-type') || '';
    validateContentType(contentType);

    const buffer = await response.blob().then(b => b.arrayBuffer());
    return new Uint8Array(buffer);
  } catch (error: any) {
    if (error.response) {
      throw new FontaineFetchError(normalizedUrl, error.response.status);
    }
    throw new FontaineFetchError(normalizedUrl);
  }
}
