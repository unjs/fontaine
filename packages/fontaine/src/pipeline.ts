import { defu } from 'defu';
import { resolveFont } from './resolver.js';
import { analyzeFont } from './metrics.js';
import { transformFontCss, TransformOptions } from './transform.js';
import { formatOutput, FormatOptions } from './formatter.js';

export interface AnalysisOptions {
  fallbackFont?: string;
  format?: 'css' | 'json';
  verbose?: boolean;
}

const DEFAULT_OPTIONS: AnalysisOptions = {
  fallbackFont: 'Arial',
  format: 'css',
  verbose: false,
};

/**
 * Orchestrates the full font analysis and transformation pipeline.
 * Resolver -> Analyzer -> Transformer -> Formatter.
 */
export async function runFontPipeline(
  cssInput: string, 
  fontMapping: Record<string, string>, 
  options: AnalysisOptions = {}
): Promise<string> {
  const config = defu(options, DEFAULT_OPTIONS);
  let processedCss = cssInput;

  for (const [fontName, url] of Object.entries(fontMapping)) {
    const buffer = await resolveFont(url);
    const metrics = analyzeFont(buffer, fontName);
    processedCss = transformFontCss(processedCss, metrics, { 
      fallbackFont: config.fallbackFont 
    });
  }

  return formatOutput(processedCss, { format: config.format });
}
