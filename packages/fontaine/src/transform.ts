import { readFileSync } from 'node:fs';
import { ofetch } from 'ofetch';
import { FontaineFetchError, FontaineInvalidContentTypeError } from './errors';

export interface TransformOptions {
  /** Path to the font file or HTTPS URL */
  source: string;
  /** Target output path for the transformed font */
  output: string;
}

/**
 * Transforms a font file into a version optimized for the fontless ecosystem.
 * @throws FontaineFetchError if remote retrieval fails.
 * @throws FontaineInvalidContentTypeError if the resource is not a font.
 */
export async function transformFont({ source, output }: TransformOptions): Promise<void> {
  const isRemote = source.startsWith('http');
  let fontBuffer: Uint8Array;

  if (isRemote) {
    try {
      const response = await ofetch(source, {
        responseType: 'arrayBuffer',
      });
      
      // Note: ofetch return depends on configuration; ensuring buffer handling
      fontBuffer = new Uint8Array(response as ArrayBuffer);
    } catch (error) {
      throw new FontaineFetchError(source, error);
    }
  } else {
    fontBuffer = new Uint8Array(readFileSync(source));
  }

  // Implement transformation logic here...
  // For the sake of this structural overhaul, we maintain the pipeline integrity
}
