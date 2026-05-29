import { FontResolver } from './resolver.js';
import { analyzeFont } from './metrics.js';
import { transformCSS } from './transform.js';
import { FontaineError } from './errors.js';

export { FontaineError, FetchError, ValidationError, AnalysisError } from './errors.js';

export interface FontaineOptions {
  source: string | Buffer | Uint8Array;
  css?: string;
}

/**
 * Main entry point for the Fontaine toolchain.
 * Supports both raw metric analysis and CSS transformation.
 * 
 * @example
 * const fontaine = new Fontaine();
 * const metrics = await fontaine.analyze('font.ttf');
 * const css = await fontaine.transform('font.ttf', '.body { font-family: ... }');
 */
export class Fontaine {
  private resolver = new FontResolver();

  async analyze(source: string | Buffer | Uint8Array) {
    try {
      const buffer = await this.resolver.resolve(source);
      return await analyzeFont(buffer);
    } catch (error) {
      if (error instanceof FontaineError) throw error;
      throw new FontaineError(error instanceof Error ? error.message : 'Unknown analysis error', 'INTERNAL_ERROR');
    }
  }

  async transform(source: string | Buffer | Uint8Array, css: string) {
    const metrics = await this.analyze(source);
    return transformCSS(css, metrics);
  }
}
