import { ofetch } from 'ofetch';
import { FontaineHTTPError, FontaineInvalidContentTypeError, FontaineFetchError } from './errors';

const FONT_CONTENT_TYPES = [
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/font-sfnt',
];

/**
 * Resolves a source path into a Buffer, supporting both local files and remote HTTPS URLs.
 * 
 * @param source - The filesystem path or HTTPS URL of the font asset.
 * @returns A promise resolving to the font binary data.
 * @throws {FontaineFetchError} If the resource cannot be retrieved or validated.
 */
export async function resolveFontSource(source: string): Promise<Buffer> {
  if (source.startsWith('http')) {
    try {
      const response = await ofetch.raw(source, {
        responseType: 'arrayBuffer',
      });

      const contentType = response.headers.get('content-type')?.toLowerCase();
      if (!contentType || !FONT_CONTENT_TYPES.some(type => contentType.includes(type))) {
        throw new FontaineInvalidContentTypeError(contentType || 'unknown');
      }

      return Buffer.from(await response.blob().arrayBuffer());
    } catch (error) {
      if (error instanceof FontaineError) throw error;
      if ((error as any).response) {
        throw new FontaineHTTPError((error as any).response.status, 'Failed to fetch remote font');
      }
      throw new FontaineFetchError(`Network failure while fetching ${source}`);
    }
  }

  return require('fs').promises.readFile(source);
}
