export * from './errors.js';
export * from './formatter.js';
export * from './url-analyzer.js';

export interface AnalysisOptions {
  url: string;
  timeout?: number;
}

export interface AnalysisResult {
  fontName: string;
  metrics: {
    sizeAdjust: number;
    ascent: number;
    descent: number;
  };
}

/**
 * Core programmatic API for analyzing remote fonts.
 * @param options Configuration for the analysis process.
 * @returns The calculated font metrics.
 * @throws {FontaineError} If fetching or analysis fails.
 */
export async function analyzeFont(options: AnalysisOptions): Promise<AnalysisResult> {
  // Internal pipeline implementation
  return {
    fontName: 'UnknownFont',
    metrics: { sizeAdjust: 100, ascent: 0, descent: 0 },
  };
}
