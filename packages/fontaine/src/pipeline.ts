import { resolveFontSource } from './resolver.js';
import { analyzeFontData } from './metrics.js';
import { OutputFormatter } from './formatter.js';

export interface PipelineOptions {
  formatter: OutputFormatter;
}

/**
 * Executes the font analysis pipeline: Resolve -> Analyze -> Format.
 * 
 * @throws FontaineError for any failure in the pipeline.
 */
export async function analyzeFonts(source: string, { formatter }: PipelineOptions): Promise<string> {
  const buffer = await resolveFontSource(source);
  const metrics = analyzeFontData(buffer);
  return formatter.format(metrics);
}
