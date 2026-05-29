import { resolveSource } from './resolver.js';
import { extractMetrics } from './metrics.js';
import { AnalysisResult } from './formatter.js';

export interface AnalysisOptions {
  format: 'json' | 'css';
}

/**
 * Orchestrates the font analysis pipeline: Resolver -> Validator -> Engine.
 */
export async function analyzeFont(url: string): Promise<AnalysisResult> {
  const source = await resolveSource(url);
  const metrics = extractMetrics(source.buffer);

  return {
    url,
    metrics,
    timestamp: new Date().toISOString(),
  };
}
