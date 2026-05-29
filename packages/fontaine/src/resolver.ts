import fs from 'node:fs/promises';
import { ofetch } from 'ofetch';
import { FetchError, ValidationError } from './errors.js';

/**
 * Supported MIME types for font analysis.
 */
const SUPPORTED_MIME_TYPES = [
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/font-sfnt',
  'application/x-font-ttf',
  'application/x-font-otf',
];

/**
 * Resolves a font source from a local path or remote URL into a Buffer.
 * 
 * @param source - The path or URL to the font file.
 * @returns A Promise resolving to the font data as a Buffer.
 * @throws {FetchError} If the source cannot be reached.
 * @throws {ValidationError} If the source is not a recognized font type.
 */
export async function resolveFontSource(source: string): Promise<Buffer> {
  if (source.startsWith('http')) {
    try {
      const response = await ofetch.raw(source, {
        responseType: 'arrayBuffer',
      });

      const contentType = response.headers.get('content-type')?.toLowerCase();
      if (!contentType || !SUPPORTED_MIME_TYPES.includes(contentType)) {
        throw new ValidationError(`Unsupported Content-Type: ${contentType}`);
      }

      return Buffer.from(response._data as ArrayBuffer);
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      throw new FetchError(`Failed to fetch remote font: ${source}`, (err as any).status);
    }
  }

  try {
    return await fs.readFile(source);
  } catch (err) {
    throw new FetchError(`Failed to read local font: ${source}`);
  }
}
