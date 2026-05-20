import { readFile } from 'node:fs/promises';
import { ofetch } from 'ofetch';
import { FontaineFetchError, FontaineResolutionError, FontaineInvalidContentTypeError } from './errors.js';

export async function resolveSource(source: string): Promise<Uint8Array> {
  if (source.startsWith('http')) {
    try {
      const response = await ofetch.raw(source);
      const contentType = response.headers.get('content-type') || '';
      
      if (!contentType.includes('font') && !contentType.includes('application/octet-stream')) {
        throw new FontaineInvalidContentTypeError(contentType);
      }
      
      return new Uint8Array(await response.blob().then(b => b.arrayBuffer()));
    } catch (error) {
      if (error instanceof FontaineError) throw error;
      throw new FontaineFetchError(error instanceof Error ? error.message : 'Unknown fetch error');
    }
  }

  try {
    const buffer = await readFile(source);
    return new Uint8Array(buffer);
  } catch (error) {
    throw new FontaineResolutionError(source);
  }
}
