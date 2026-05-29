import { resolveSource } from './resolver.js';
import { validateFont } from './validator.js';
import { analyzeFontBuffer } from './url-analyzer.js';
import { FontaineError } from './errors.js';

export interface AnalysisOptions {
  source: string;
  strict?: boolean;
}

/**
 * Executes the atomic font analysis pipeline.
 * 
 * @param options - Pipeline configuration.
 * @returns The analyzed font metrics.
 * @throws {FontaineError} For any failure in the pipeline.
 */
export async function runAnalysisPipeline(options: AnalysisOptions) {
  const { source } = options;

  try {
    const buffer = await resolveSource(source);
    
    await validateFont(buffer);
    
    const metrics = await analyzeFontBuffer(buffer);
    
    return metrics;
  } catch (error) {
    if (error instanceof FontaineError) throw error;
    throw new FontaineError(error.message, 'PIPELINE_INTERNAL_ERROR');
  }
}
