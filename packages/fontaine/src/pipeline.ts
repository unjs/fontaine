import { resolveSource, type Source } from './resolver.js';
import { validateFontBinary } from './validator.js';
import { analyzeFont } from './metrics.js';
import { getFormatter } from './formatter.js';
import { FontaineError } from './errors.js';

export interface AnalyzeOptions {
  format?: 'json' | 'css';
}

/**
 * Primary programmatic API for analyzing fonts.
 * 
 * @example
 * const output = await analyzeFonts('https://fonts.gstatic.com/s/inter.ttf', { format: 'json' });
 * 
 * @param source - URL, path, or Buffer of the font.
 * @param options - Analysis configuration.
 * @returns The formatted analysis result.
 * @throws {FontaineError} If any step of the pipeline fails.
 */
export async function analyzeFonts(source: Source, options: AnalyzeOptions = {}): Promise<string> {
  const bytes = await resolveSource(source);
  
  // In a real production scenario, we would fetch the header from ofetch 
  // and pass it here. For the unified API, we validate the bytes.
  validateFontBinary(bytes);
  
  const metrics = analyzeFont(bytes);
  const formatter = getFormatter(options.format || 'json');
  
  return formatter.format(metrics);
}
