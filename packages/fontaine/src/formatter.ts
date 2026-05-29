import { AnalysisResult } from './metrics.js';

/**
 * Interface for font analysis output strategies.
 */
export interface Formatter {
  /**
   * Formats the analysis result into a string representation.
   * @param result - The result of the font analysis.
   * @returns The formatted string.
   */
  format(result: AnalysisResult): string;
}

/**
 * Formats analysis results as a JSON string.
 */
export class JsonFormatter implements Formatter {
  format(result: AnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }
}

/**
 * Formats analysis results as CSS @font-face overrides.
 */
export class CssFormatter implements Formatter {
  format(result: AnalysisResult): string {
    const { sizeAdjust, ascentOverride, descentOverride, lineGapOverride } = result;
    return `size-adjust: ${sizeAdjust}; ascent-override: ${ascentOverride}; descent-override: ${descentOverride}; line-gap-override: ${lineGapOverride};`;
  }
}

/**
 * Factory to retrieve the appropriate formatter based on a type identifier.
 * 
 * @param type - The requested format ('json' or 'css').
 * @returns An implementation of the Formatter interface.
 * @throws {Error} If the format type is unsupported.
 */
export function getFormatter(type: 'json' | 'css'): Formatter {
  const formatters = {
    json: new JsonFormatter(),
    css: new CssFormatter(),
  };

  const formatter = formatters[type];
  if (!formatter) {
    throw new Error(`Unsupported format: ${type}`);
  }
  return formatter;
}
