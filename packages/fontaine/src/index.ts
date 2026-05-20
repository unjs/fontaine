import { FontSourceResolver } from './resolver.js';
import { MetricAnalyzer } from './metrics.js';
import { OutputFormatter, JsonFormatter } from './formatter.js';
import { FontaineError } from './errors.js';

export * from './errors.js';
export * from './metrics.js';
export * from './formatter.js';

/**
 * Configuration for the Fontaine analysis pipeline.
 */
export interface FontaineOptions {
  formatter?: OutputFormatter;
}

/**
 * Main entry point for programmatic font analysis.
 * 
 * @param sources - A list of local paths or URLs to analyze.
 * @param options - Configuration options for the pipeline.
 * @returns A promise resolving to an array of formatted results.
 * @throws {FontaineError} If the pipeline fails critically.
 */
export async function analyzeFonts(
  sources: string[], 
  { formatter = new JsonFormatter() }: FontaineOptions = {}
): Promise<string[]> {
  const resolver = new FontSourceResolver();
  const analyzer = new MetricAnalyzer();

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const buffer = await resolver.resolve(source);
      const metrics = analyzer.analyze(buffer, source);
      return formatter.format(metrics);
    })
  );

  return results.map((res, idx) => {
    if (res.status === 'rejected') {
      if (res.reason instanceof FontaineError) {
        return `Error analyzing ${sources[idx]}: ${res.reason.message}`;
      }
      return `Unexpected error analyzing ${sources[idx]}: ${res.reason}`;
    }
    return res.value;
  });
}
