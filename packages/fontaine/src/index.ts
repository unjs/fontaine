import { analyzeFont, AnalysisOptions } from './pipeline.js';
import { formatOutput, AnalysisResult } from './formatter.js';

/**
 * High-level programmatic API for font analysis.
 * This serves as the source of truth for the CLI wrapper.
 */
export async function analyzeFonts(
  urls: string[], 
  options: AnalysisOptions = { format: 'json' }
): Promise<string[]> {
  const results = await Promise.all(
    urls.map(async (url) => {
      const result = await analyzeFont(url);
      return formatOutput(result, options.format);
    })
  );
  return results;
}

export * from './errors.js';
