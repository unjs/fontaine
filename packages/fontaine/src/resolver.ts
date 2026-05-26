import fs from 'node:fs/promises';
import { ofetch } from 'ofetch';
import { FontaineInvalidContentTypeError, FontaineResolutionError } from './errors.js';
import { isValidFontMime } from './url-analyzer.js';

export interface ResourcePayload {
  buffer: Buffer;
  mimeType: string;
}

export async function resolveAsset(url: string): Promise<ResourcePayload> {
  if (url.startsWith('http')) {
    try {
      const response = await ofetch.raw(url);
      const contentType = response.headers.get('content-type') || '';
      
      if (!isValidFontMime(contentType)) {
        throw new FontaineInvalidContentTypeError(contentType);
      }

      const buffer = await response.blob().then(blob => blob.arrayBuffer());
      return { 
        buffer: Buffer.from(buffer), 
        mimeType: contentType 
      };
    } catch (error) {
      if (error instanceof FontaineInvalidContentTypeError) throw error;
      throw new FontaineResolutionError(`Remote fetch failed: ${url}`);
    }
  }

  try {
    const buffer = await fs.readFile(url);
    // Local files lack MIME headers; validation happens via extension or magic bytes in pipeline
    return { 
      buffer, 
      mimeType: 'application/octet-stream' 
    };
  } catch (error) {
    throw new FontaineResolutionError(`Local file access failed: ${url}`);
  }
}
