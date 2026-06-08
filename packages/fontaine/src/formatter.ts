import type { FontMetrics } from './metrics.js';

/**
 * Strategy interface for font metric output formatting.
 */
export interface OutputFormatter {
  /**
   * Formats the analyzed metrics into a string.
   * 
   * @param metrics - The metrics result from the analysis phase.
   * @returns The formatted string representation.
   */
  format(metrics: FontMetrics): string;
}

/**
 * Formatter that outputs metrics as a JSON string.
 */
export class JsonFormatter implements OutputFormatter {
  format(metrics: FontMetrics): string {
    return JSON.stringify(metrics, null, 2);
  }
}

/**
 * Formatter that outputs metrics as CSS @font-face overrides.
 */
export class CssFormatter implements OutputFormatter {
  format(metrics: FontMetrics): string {
    return `@font-face {\n  font-family: '${metrics.family}';\n  size-adjust: ${metrics.sizeAdjust}%;\n}`;
  }
}

/**
 * Factory for retrieving the appropriate formatter based on requested format.
 */
export function getFormatter(format: 'json' | 'css'): OutputFormatter {
  const formatters = {
    json: new JsonFormatter(),
    css: new CssFormatter(),
  };
  return formatters[format];
}
