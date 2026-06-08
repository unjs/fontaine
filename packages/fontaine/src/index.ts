import { runFontPipeline } from './pipeline.js';
import type { AnalysisOptions } from './config.js';
import * as Errors from './errors.js';

/**
 * Programmatic API for font analysis.
 * 
 * @param source - URL or filesystem path to the font file.
 * @param options - Configuration for analysis and formatting.
 * @throws {Errors.FontaineError} If any stage of the pipeline fails.
 */
export async function analyzeFonts(
  source: string,
  options: AnalysisOptions = { format: 'css' }
): Promise<string> {
  return runFontPipeline(source, options);
}

export { Errors };
