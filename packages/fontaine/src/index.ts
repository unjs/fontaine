import { resolveFontSource } from './resolver.js';
import { analyzeFont } from './metrics.js';
import { JsonFormatter, CssFormatter, type OutputFormatter } from './formatter.js';
import { FontaineError } from './errors.js';

export * from './errors.js';

/**
 * Configuration options for the Fontaine analysis pipeline.
 */
export interface FontaineOptions {
  /** Format of the output. Defaults to 'json'. */
  format?: 'json' | 'css';
}

/**
 * Analyzes a font asset and returns the formatted metrics.
 * 
 * @param source - Local path or remote URL to the font.
 * @param options - Pipeline configuration.
 * @returns Formatted metrics as a string.
 * @throws {FontaineError} If any stage of the pipeline fails.
 */
export async function analyzeFonts(source: string, options: FontaineOptions = {}): Promise<string> {
  const resolver = resolveFontSource;
  const analyzer = analyzeFont;
  
  const formatter: OutputFormatter = options.format === 'css' 
    ? new CssFormatter() 
    : new JsonFormatter();

  try {
    const buffer = await resolver(source);
    const metrics = analyzer(buffer);
    return formatter.format(metrics);
  } catch (error) {
    if (error instanceof FontaineError) throw error;
    throw new FontaineError(`Unexpected error during analysis: ${String(error)}`, 'UNKNOWN_ERROR');
  }
}
