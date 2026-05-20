import { FontResolver } from './resolver.js';
import { OutputFormatter } from './formatter.js';
import { analyzeFont } from './metrics.js';
import { FontaineError } from './errors.js';

export * from './errors.js';
export * from './metrics.js';
export * from './formatter.js';
export * from './css.js';

export interface AnalysisOptions {
  source: string;
  formatter: OutputFormatter;
}

/**
 * Main entry point for the Fontaine programmatic API.
 * 
 * @param options - Configuration for the analysis pipeline.
 * @returns The formatted analysis results.
 * @throws {FontaineError} If any stage of the pipeline fails.
 */
export async function runFontaine({ source, formatter }: AnalysisOptions): Promise<string> {
  const resolver = new FontResolver();
  
  try {
    const fontBuffer = await resolver.resolve(source);
    const fontMetrics = await analyzeFont(fontBuffer);
    return formatter.format(fontMetrics);
  } catch (error) {
    if (error instanceof FontaineError) throw error;
    throw new FontaineError(error instanceof Error ? error.message : 'Unknown failure', 'INTERNAL_ERROR');
  }
}
