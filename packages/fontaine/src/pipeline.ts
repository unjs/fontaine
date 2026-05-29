import { resolveFont } from './resolver.js';
import { analyzeUrl } from './url-analyzer.js';
import { transformFont } from './transform.js';

export interface PipelineOptions {
  fetch?: any;
}

/**
 * Orchestrates the Source -> Analysis -> Formatting pipeline.
 * 
 * @param source - Source URL or path.
 * @param options - Pipeline configuration.
 */
export async function runFontainePipeline(source: string, options: PipelineOptions = {}) {
  if (source.startsWith('http')) {
    await analyzeUrl(source, options.fetch);
  }

  const buffer = await resolveFont(source, options);
  const metrics = transformFont(buffer);

  return metrics;
}
