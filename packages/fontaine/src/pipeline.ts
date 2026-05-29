import defu from 'defu';
import { resolveFontSource } from './resolver.js';
import { getFormatter } from './formatter.js';
import { analyzeFont } from './metrics.js';

export interface PipelineOptions {
  source: string;
  format?: string;
}

const DEFAULT_OPTIONS: PipelineOptions = {
  format: 'json',
};

/**
 * Orchestrates the Source Resolver -> Core Analyzer -> Output Formatter pipeline.
 * @param options - Execution configuration.
 * @returns The formatted analysis result.
 */
export async function runPipeline(options: PipelineOptions) {
  const config = defu(options, DEFAULT_OPTIONS);
  
  const buffer = await resolveFontSource(config.source);
  const metrics = await analyzeFont(buffer);
  const formatter = getFormatter(config.format!);
  
  return formatter.format(metrics);
}
