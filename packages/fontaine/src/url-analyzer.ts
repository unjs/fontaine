import ofetch from 'ofetch';
import { FontaineFetchError } from './errors.js';

const FONT_MIME_TYPES = new Set([
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/font-woff',
  'application/font-woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/vnd.ms-fontobject',
]);

/**
 * Fetches a font asset and validates its Content-Type.
 * @param url The remote URL of the font asset.
 * @returns The raw buffer of the font asset.
 * @throws {FontaineFetchError} If the network request fails or MIME type is invalid.
 */
export async function fetchFontAsset(url: string): Promise<Uint8Array> {
  try {
    const response = await ofetch.raw(url, {
      responseType: 'arrayBuffer',
    });

    const contentType = response.headers.get('content-type')?.split(';')[0];
    if (!contentType || !FONT_MIME_TYPES.has(contentType)) {
      throw new FontaineFetchError(url, `Invalid Content-Type: ${contentType}`);
    }

    return new Uint8Array(response._data);
  } catch (err) {
    if (err instanceof FontaineFetchError) throw err;
    throw new FontaineFetchError(url, (err as Error).message);
  }
}
