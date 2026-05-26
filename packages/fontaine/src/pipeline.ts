import { createResolver } from './resolver.js';
import { validateFontBuffer } from './validator.js';
import { FontaineError } from './errors.js';
import { analyzeFontMetrics } from './metrics.js'; // Assuming this exists from previous implementation

export type AnalysisResult = {
  success: true;
  data: ReturnType<typeof analyzeFontMetrics>;
};

export type AnalysisError = {
  success: false;
  error: FontaineError;
};

export type AnalysisResponse = AnalysisResult | AnalysisError;

/**
 * Orchestrates the font analysis flow: Resolve -> Validate -> Analyze.
 */
export async function analyzeFonts(url: string): Promise<AnalysisResponse> {
  try {
    const resolver = createResolver(url);
    const buffer = await resolver.resolve(url);
    
    validateFontBuffer(buffer);
    
    const metrics = analyzeFontMetrics(buffer);
    
    return {
      success: true,
      data: metrics,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof FontaineError ? err : new FontaineError(String(err)),
    };
  }
}
