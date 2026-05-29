import { resolveFont } from './resolver.js';
import { analyzeFont } from './metrics.js';
import { validateMagicBytes } from './validator.js';
import { FontaineFormatter, FORMATTERS } from './formatter.js';
import { FontaineAnalysisError } from './errors.js';

export interface PipelineOptions {
  format?: keyof typeof FORMATTERS;
  timeout?: number;
}

/**
 * Orchestrates the Resolver -> Validator -> Analyzer -> Formatter pipeline.
 */
export async function runFontainePipeline(url: string, options: PipelineOptions = {}) {
  const { format = 'json', timeout = 10000 } = options;
  
  const buffer = await resolveFont(url, { timeout });
  validateMagicBytes(buffer);
  
  try {
    const metrics = await analyzeFont(buffer);
    const formatter = FORMATTERS[format];
    
    if (!formatter) {
      throw new FontaineAnalysisError(`Unsupported format: ${format}`);
    }
    
    return formatter.format(metrics);
  } catch (error: any) {
    throw new FontaineAnalysisError(error.message);
  }
}
