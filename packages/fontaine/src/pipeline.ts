import { resolveFontSource } from './resolver.js';
import { analyzeFont } from './metrics.js';
import { formatMetrics } from './formatter.js';
import type { AnalysisOptions, FontMetrics } from './config.js';

/**
 * Core pipeline orchestrating the flow from source to formatted output.
 * Flow: Source -> Resolver -> ArrayBuffer -> Analyzer -> Metrics -> Formatter -> Output.
 * 
 * @throws {FontaineError} Propagates domain-specific errors from pipeline stages.
 */
export async function runFontPipeline(
  source: string,
  options: AnalysisOptions
): Promise<string> {
  const buffer = await resolveFontSource(source);
  const metrics = await analyzeFont(buffer);
  return formatMetrics(metrics, options.format);
}
