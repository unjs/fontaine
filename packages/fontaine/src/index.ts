import { resolveFont } from './resolver.js';
import { validateFontBuffer } from './validator.js';
import { analyzeFont } from './transform.js'; // Assuming analyzeFont exists in transform.ts
import { formatToCss, formatToJson } from './formatter.js';
import type { FontMetrics } from './metrics.js';

export * from './errors.js';

/**
 * Orchestrates the font analysis pipeline.
 * 
 * @param source - Remote URL or local path to the font.
 * @param options - Configuration for output format.
 * @returns The result of the analysis in the requested format.
 */
export async function analyze(source: string, options: { format: 'css' | 'json' } = { format: 'css' }) {
  const fontBuffer = await resolveFont(source);
  validateFontBuffer(fontBuffer);
  
  const metrics: FontMetrics = analyzeFont(fontBuffer);

  return options.format === 'css' 
    ? formatToCss(metrics) 
    : formatToJson(metrics);
}
