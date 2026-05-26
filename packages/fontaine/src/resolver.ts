import fs from 'node:fs/promises';
import { FontaineFetchError, FontaineResolverError, FontaineValidationError } from './errors.js';

export async function resolveFontSource(source: string): Promise<Buffer> {
  if (source.startsWith('https://')) {
    try {
      const response = await fetch(source);
      if (!response.ok) {
        throw new FontaineFetchError(source, response.status);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('font')) {
        throw new FontaineValidationError(`Expected font content-type, got ${contentType}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (error instanceof FontaineError) throw error;
      throw new FontaineFetchError(source, 0);
    }
  }

  try {
    return await fs.readFile(source);
  } catch (error) {
    throw new FontaineResolverError(source, (error as Error).message);
  }
}
