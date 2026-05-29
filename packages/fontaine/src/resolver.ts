import { readFile } from 'node:fs/promises';
import { FetchError, InvalidContentTypeError, ResolutionError } from './errors.js';

export interface FontResolver {
  resolve(source: string): Promise<Buffer>;
}

export class LocalResolver implements FontResolver {
  async resolve(path: string): Promise<Buffer> {
    try {
      return Buffer.from(await readFile(path));
    } catch (error) {
      throw new ResolutionError(`Failed to read local file at ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export class RemoteResolver implements FontResolver {
  async resolve(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new FetchError(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      const isFont = contentType?.startsWith('font/') || 
                     contentType?.includes('application/x-font') || 
                     contentType?.includes('application/font');

      if (!isFont) {
        throw new InvalidContentTypeError(contentType || 'undefined');
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (error instanceof FontaineError) throw error;
      throw new FetchError(`Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export class FontResolverFactory {
  static create(source: string): FontResolver {
    return source.startsWith('http://') || source.startsWith('https://') 
      ? new RemoteResolver() 
      : new LocalResolver();
  }
}
