import { resolveFontSource } from './resolver.js';
import { analyzeFonts } from './metrics.js';
import { FontFormatter } from './formatter.js';

export interface PipelineOptions {
  formatter: FontFormatter;
  overridesOnly?: boolean;
}

/**
 * Orchestrates the resolution, analysis, and formatting of font assets.
 * 
 * @param source - Source identifier (URL or Path).
 * @param options - Formatting and filtering options.
 * @returns The serialized result of the analysis.
 */
export async function runPipeline(source: string, { formatter, overridesOnly }: PipelineOptions) {
  const buffer = await resolveFontSource(source);
  const metrics = analyzeFonts(buffer);
  
  if (overridesOnly) {
    // Logic to filter for only deviating metrics would go here
  }
  
  return formatter.format(metrics);
}
