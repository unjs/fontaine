import ofetch from 'ofetch';
import { validateMimeType } from './validator.js';
import { NetworkError } from './errors.js';
import { readFile } from 'node:fs/promises';

export interface ResolvedSource {
  buffer: Buffer;
  mimeType: string;
  url: string;
}

/**
 * Resolves a font asset from either a remote URL or a local file system path.
 * Ensures the asset is a valid font via MIME-type validation.
 */
export async function resolveSource(url: string): Promise<ResolvedSource> {
  try {
    if (url.startsWith('http')) {
      const response = await ofetch.raw(url);
      const mimeType = response.headers.get('content-type') || '';
      
      validateMimeType(mimeType);
      
      const buffer = await response.blob().then(blob => Buffer.from(await blob.arrayBuffer()));
      return { buffer, mimeType, url };
    }

    const buffer = await readFile(url);
    const mimeType = 'font/ttf'; // Default for local unless extended with a mime-lookup lib
    
    validateMimeType(mimeType);
    return { buffer, mimeType, url };
  } catch (error: any) {
    if (error instanceof ValidationError) throw error;
    throw new NetworkError(`Failed to resolve asset at ${url}: ${error.message}`, error.status);
  }
}
