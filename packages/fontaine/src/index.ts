import pLimit from 'p-limit';
import { FontResolver } from './resolver';
import { analyze } from './metrics';
import { transform } from './transform';
import { FontaineError } from './errors';

const limit = pLimit(5);
const resolver = new FontResolver();

/**
 * Low-level API to extract raw font metrics.
 * 
 * @param source - URL or filesystem path to the font file.
 * @returns A promise resolving to the analysis metrics.
 * @throws {FontaineError} If resolution or analysis fails.
 */
export async function analyzeFont(source: string) {
  return limit(async () => {
    try {
      const buffer = await resolver.resolve(source);
      return await analyze(buffer);
    } catch (error) {
      if (error instanceof FontaineError) throw error;
      throw new FontaineError(String(error), 'UNKNOWN_ERROR');
    }
  });
}

/**
 * High-level API to transform CSS containing @font-face rules.
 * 
 * @param css - The raw CSS input string.
 * @param options - Configuration for transformation overrides.
 * @returns A promise resolving to the transformed CSS string.
 * @throws {FontaineError} If CSS processing or font analysis fails.
 */
export async function transformCss(css: string, options: any = {}) {
  return limit(async () => {
    try {
      return await transform(css, options);
    } catch (error) {
      if (error instanceof FontaineError) throw error;
      throw new FontaineError(String(error), 'CSS_TRANSFORM_ERROR');
    }
  });
}

export * from './errors';
