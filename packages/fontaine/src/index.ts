import { FontSourceResolver } from './resolver.js';
import { AnalysisResult, Formatter, JsonFormatter } from './formatter.js';
import { FontaineError } from './errors.js';
import { analyzeFontBinary } from './pipeline.js';

export type AnalysisResponse = 
  | { success: true; data: AnalysisResult } 
  | { success: false; error: FontaineError };

/**
 * Orchestrates the resolution and analysis of a font source.
 * 
 * @complexity Time: O(N) where N is the size of the font binary.
 * @throws {FontaineError} if resolution or analysis fails.
 */
export async function analyzeFonts(
  source: string, 
  options: { formatter?: Formatter } = {}
): Promise<AnalysisResponse> {
  try {
    const resolver = new FontSourceResolver();
    const font = await resolver.resolve(source);
    const metrics = await analyzeFontBinary(font.buffer);
    
    const result: AnalysisResult = {
      metrics,
      fontFamily: source.split('/').pop() || 'Unknown',
      source,
    };

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof FontaineError) {
      return { success: false, error };
    }
    return { 
      success: false, 
      error: new FontaineError(error instanceof Error ? error.message : 'Unknown error') 
    };
  }
}
