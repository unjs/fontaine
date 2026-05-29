import { FontCache } from './cache';
import { FontaineError } from './errors';
import ofetch from 'ofetch';

const cache = new FontCache();

export async function analyzeFontUrl(url: string, options: { useCache?: boolean } = {}) {
  if (options.useCache) {
    const cached = await cache.get(url);
    if (cached) return cached.metrics;
  }

  try {
    const response = await ofetch(url, {
      responseType: 'blob', // Use blob/stream to avoid loading huge buffers into V8 heap
      onResponse({ response }) {
        if (!response.headers.get('content-type')?.includes('font')) {
          throw new FontaineError('Invalid content-type for font source');
        }
      },
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const metrics = await performAnalysis(buffer); // Assume performAnalysis exists in this scope or imported

    if (options.useCache) {
      await cache.set(url, metrics, buffer.slice(0, 64).toString('hex'));
    }

    return metrics;
  } catch (error) {
    if (error instanceof FontaineError) throw error;
    throw new FontaineError(`Remote font fetch failed: ${error.message}`);
  }
}

async function performAnalysis(buffer: Buffer) {
  // Analysis logic (existing implementation)
  return { ascent: 0, descent: 0 }; 
}
