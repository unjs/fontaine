import { ofetch } from 'ofetch';
import { FetchError, ValidationError } from './errors';

const ALLOWED_FONT_MIME_TYPES = new Set([
  'font/woff2',
  'font/woff',
  'font/ttf',
  'font/otf',
  'application/font-woff2',
  'application/font-woff',
  'application/x-font-ttf',
  'application/x-font-otf',
]);

/**
 * Resolves a font source into a Buffer, ensuring the payload is a valid font.
 * @param source - The URL or local path to the font.
 * @throws {FetchError} If the remote request fails.
 * @throws {ValidationError} If the MIME type is not a recognized font format.
 */
export async function resolveFont(source: string): Promise<Buffer> {
  if (!source.startsWith('http')) {
    // Local file resolution logic (omitted for brevity, assuming fs.readFileSync)
    return Buffer.from(''); 
  }

  try {
    const response = await ofetch.raw(source, {
      responseType: 'arrayBuffer',
    });

    const contentType = response.headers.get('content-type')?.split(';')[0];

    if (!contentType || !ALLOWED_FONT_MIME_TYPES.has(contentType)) {
      throw new ValidationError(`Invalid MIME type: ${contentType}. Expected one of ${Array.from(ALLOWED_FONT_MIME_TYPES).join(', ')}`);
    }

    return Buffer.from(response._data as ArrayBuffer);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new FetchError(source);
  }
}
