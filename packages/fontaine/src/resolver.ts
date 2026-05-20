import { ofetch } from 'ofetch';
import { FetchError } from './errors.js';
import { validateContentType } from './validator.js';

/**
 * Resolves a font source (URL or Path) into a Uint8Array.
 * 
 * @param source - The location of the font file.
 * @returns A promise resolving to the font buffer.
 * @throws {FetchError} If the source cannot be retrieved.
 */
export async function resolveFont(source: string): Promise<Uint8Array> {
  if (source.startsWith('http')) {
    try {
      const response = await ofetch.raw(source);
      validateContentType(response.headers.get('content-type'));
      
      const buffer = await response.blob().then(b => b.arrayBuffer());
      return new Uint8Array(buffer);
    } catch (error: any) {
      throw new FetchError(error.message, error.status);
    }
  }

  // Node-specific local file resolution
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = await import('node:fs/promises');
      const buffer = await fs.readFile(source);
      return new Uint8Array(buffer);
    } catch (error: any) {
      throw new FetchError(`Failed to read local file: ${error.message}`);
    }
  }

  throw new FetchError('Unsupported environment for local file resolution.');
}
