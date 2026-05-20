import { DefaultFontSourceResolver } from './resolver.js';
import { analyze } from './metrics.js';
import { JsonFormatter, OutputFormatter, AnalysisResult } from './formatter.js';
import { FontaineError } from './errors.js';

export interface FontaineOptions {
  resolver?: any;
  formatter?: OutputFormatter;
}

/**
 * Main analysis pipeline.
 * Orchestrates source resolution, metric analysis, and output formatting.
 */
export async function runAnalysis(
  source: string, 
  options: FontaineOptions = {}
): Promise<string> {
  const { 
    resolver = new DefaultFontSourceResolver(), 
    formatter = new JsonFormatter() 
  } = options;

  try {
    const buffer = await resolver.resolve(source);
    const result = await analyze(buffer);
    return formatter.format(result);
  } catch (error) {
    if (error instanceof FontaineError) throw error;
    throw new FontaineError(`Unexpected pipeline error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export * from './errors.js';
export * from './formatter.js';
export * from './resolver.js';
