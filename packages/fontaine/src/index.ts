import { FontResolverFactory } from './resolver.js';
import { pipeline } from './pipeline.js';

export interface AnalyzeOptions {
  /** Precision for metric calculations */
  precision?: number;
  /** Force a specific resolver strategy */
  strategy?: 'local' | 'remote';
}

/**
 * Analyzes a font from a local path, URL, or raw Buffer.
 * 
 * @param source - The font source (URL, File Path, or Buffer)
 * @param options - Configuration for analysis
 * @returns Analysis results
 * @throws {FontaineError} if resolution or analysis fails
 */
export async function analyzeFonts(source: string | Buffer, options: AnalyzeOptions = {}) {
  let buffer: Buffer;

  if (Buffer.isBuffer(source)) {
    buffer = source;
  } else {
    const resolver = FontResolverFactory.create(source);
    buffer = await resolver.resolve(source);
  }

  return pipeline(buffer, options);
}

export * from './errors.js';
