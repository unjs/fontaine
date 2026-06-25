import fs from 'node:fs/promises';
import { ofetch } from 'ofetch';
import { FetchError } from './errors.js';
import { validateFontMime } from './validator.js';

export interface ResolvedAsset {
  buffer: ArrayBuffer;
  mimeType: string;
}

/**
 * Resolves a font source (local path or URL) into a common ArrayBuffer.
 * 
 * @param source - The path or URL to the font asset.
 * @throws {FetchError} If the asset cannot be retrieved.
 * @throws {ValidationError} If the asset is not a font.
 * @returns {Promise<ResolvedAsset>} The binary buffer and its mime-type.
 */
export async function resolveFont(source: string): Promise<ResolvedAsset> {
  if (source.startsWith('http')) {
    try {
      const response = await ofetch.raw(source, {
        responseType: 'arrayBuffer',
      });
      const mimeType = response.headers.get('content-type') || 'application/octet-stream';
      validateFontMime(mimeType);
      return {
        buffer: response._data,
        mimeType,
      };
    } catch (error: any) {
      throw new FetchError(source, error.response?.status);
    }
  }

  try {
    const buffer = await fs.readFile(source);
    // Local files lack headers; basic extension check or assume valid if passed to analyzer
    return {
      buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      mimeType: 'application/octet-stream',
    };
  } catch (error) {
    throw new FetchError(source);
  }
}
