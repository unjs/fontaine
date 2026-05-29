import { resolveFontSource } from './resolver.js';
import { getFormatter } from './formatter.js';
import { analyzeFontMetrics } from './metrics.js';
import { AnalysisError } from './errors.js';

export interface AnalyzeOptions {
  /** The path or URL to the font file */
  source: string;
  /** The desired output format */
  format: 'json' | 'css';
  /** Optional configuration for metrics calculation */
  metricsOptions?: Record<string, any>;
}

/**
 * Orchestrates the font analysis pipeline: Resolve -> Analyze -> Format.
 * 
 * @param options - Configuration for the analysis process.
 * @returns The formatted analysis result.
 * @throws {FontaineError} If any stage of the pipeline fails.
 */
export async function analyzeFonts({ source, format, metricsOptions }: AnalyzeOptions): Promise<string> {
  try {
    const buffer = await resolveFontSource(source);
    const metrics = await analyzeFontMetrics(buffer, metricsOptions);
    const formatter = getFormatter(format);
    
    return formatter.format(metrics);
  } catch (err) {
    if (err instanceof Error && 'code' in err) throw err;
    throw new AnalysisError(err instanceof Error ? err.message : 'Unknown analysis failure');
  }
}
