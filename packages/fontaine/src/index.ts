import { runAnalysis } from './pipeline.js';
import { transformCSS } from './transform.js';
import { validateAnalyzeOptions, validateTransformOptions } from './validator.js';

/**
 * Analyzes a font source and returns the result in the specified format.
 * This is the core programmatic entry point for font metric extraction.
 */
export async function analyze(options: { source: string; format?: 'json' | 'css' }) {
  const validated = validateAnalyzeOptions(options);
  return runAnalysis(validated.source, validated.format);
}

/**
 * Transforms a CSS file by analyzing referenced fonts and injecting overrides.
 */
export async function transform(options: { input: string; output?: string }) {
  const validated = validateTransformOptions(options);
  return transformCSS(validated.input, validated.output);
}
