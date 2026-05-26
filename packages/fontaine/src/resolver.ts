import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import ofetch from 'ofetch';
import { ResolutionError } from './errors.js';

export type SourceStream = Readable | ReadableStream;

/**
 * Resolves a source identifier into a readable stream.
 * Supports local file system paths and HTTPS URLs.
 */
export async function resolveSource(source: string): Promise<SourceStream> {
  try {
    if (source.startsWith('http://') || source.startsWith('https://')) {
      const response = await ofetch.raw(source);
      if (!response.ok) {
        throw new ResolutionError(source, `HTTP ${response.status}`);
      }
      return response.body as ReadableStream;
    }

    return createReadStream(source);
  } catch (error) {
    if (error instanceof ResolutionError) throw error;
    throw new ResolutionError(source, (error as Error).message);
  }
}
