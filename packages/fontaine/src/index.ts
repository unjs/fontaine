import { FontResolver } from './resolver.js';
import { FontaineAnalysisError } from './errors.js';
import { analyze } from './pipeline.js';

const resolver = new FontResolver();

/**
 * Programmatic entry point for font analysis.
 * 
 * @param source - URL or file path to the font.
 * @param options - Configuration for the analysis pipeline.
 * @throws {FontaineError} based on the failure mode (Network, FS, Analysis).
 * @returns The result of the font analysis.
 */
export async function analyzeFont(source: string, options: any = {}) {
  try {
    const data = await resolver.resolve(source);
    return await analyze(data, options);
  } catch (err) {
    if (err instanceof Error && !(err instanceof FontaineAnalysisError)) {
      // Wrap unknown errors in AnalysisError if they occur during pipeline
      throw new FontaineAnalysisError(err.message);
    }
    throw err;
  }
}

export * from './errors.js';
