import { createResolver } from './resolver.js';
import { validateFontBinary } from './validator.js';
import { FontaineError } from './errors.js';
import { analyzeFontMetrics } from './metrics.js';

export * from './errors.js';
export * from './resolver.js';

/**
 * Result of a font analysis operation.
 */
export interface AnalysisResult {
  source: string;
  metrics: any;
  success: boolean;
  error?: FontaineError;
}

/**
 * Core pipeline for font analysis.
 * Source -> Resolver -> Validator -> Analyzer.
 * 
 * @param source - Path to local file or HTTPS URL.
 * @returns The analysis result.
 * @throws {FontaineError} If the pipeline fails at any stage.
 */
export async function processFont(source: string): Promise<AnalysisResult> {
  try {
    const resolver = createResolver(source);
    const buffer = await resolver.resolve(source);
    
    validateFontBinary(buffer, source);
    
    const metrics = await analyzeFontMetrics(buffer);
    
    return {
      source,
      metrics,
      success: true,
    };
  } catch (error) {
    const fontaineError = error instanceof FontaineError 
      ? error 
      : new FontaineError((error as Error).message);
      
    return {
      source,
      metrics: null,
      success: false,
      error: fontaineError,
    };
  }
}
