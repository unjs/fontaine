import { resolveFont } from './resolver.js';
import { analyzeFont } from './metrics.js'; // Assuming metrics.ts contains the core analysis logic
import { formatResults } from './formatter.js';
import { AnalysisError } from './errors.js';

export interface PipelineOptions {
  format?: 'json' | 'text';
}

/**
 * Orchestrates the font analysis pipeline.
 * 
 * @param source - The font source to process.
 * @param options - Pipeline configuration.
 * @throws {AnalysisError} If the analysis phase fails.
 * @returns {Promise<string>} The formatted analysis results.
 */
export async function runFontPipeline(source: string, options: PipelineOptions = {}): Promise<string> {
  const { buffer } = await resolveFont(source);
  
  let metrics;
  try {
    metrics = analyzeFont(buffer);
  } catch (error: any) {
    throw new AnalysisError(error.message);
  }

  return formatResults(metrics, options.format || 'text');
}
