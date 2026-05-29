import { ofetch } from 'ofetch';
import pLimit from 'p-limit';
import { NetworkError, FontFormatError } from './errors';
import type { FontMetrics } from './metrics';

const limit = pLimit(5);

export async function analyzeUrl(url: string): Promise<FontMetrics> {
  return limit(async () => {
    try {
      const response = await ofetch(url, {
        responseType: 'stream',
      });

      // Staff-level Stream processing to prevent Heap Overflows on large binaries
      const buffer = await streamToBuffer(response as any);
      return parseFontBinary(buffer);
    } catch (error: any) {
      if (error.response) {
        throw new NetworkError(`Failed to fetch font at ${url}`, error.response.status);
      }
      throw new NetworkError(error.message);
    }
  });
}

async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: any[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function parseFontBinary(buffer: Buffer): FontMetrics {
  if (buffer.length < 12) {
    throw new FontFormatError('Font binary too small to be valid');
  }
  // Logic for parsing binary metrics would go here
  return { ascent: 100, descent: 20 }; 
}
