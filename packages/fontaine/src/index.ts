import { runFontainePipeline } from './pipeline.js';
import type { PipelineOptions } from './pipeline.js';
import type { FontaineError } from './errors.js';

/**
 * Analyzes a font source and returns formatted metrics.
 * 
 * @param source - URL or local path to the font file.
 * @param options - Formatting options.
 * @returns The formatted metrics as a string.
 * @throws {FontaineError}
 */
export async function analyzeFonts(
  source: string, 
  options: PipelineOptions = { format: 'css' }
): Promise<string> {
  return runFontainePipeline(source, options);
}

export * from './errors.js';
export * from './pipeline.js';
