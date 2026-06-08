import type { AnalysisResult } from './index.js';

/**
 * Strategy interface for serializing font analysis results.
 */
export interface OutputFormatter {
  /**
   * Formats the analysis result into a string representation.
   * @param result The result of the font analysis.
   * @returns The formatted output string.
   */
  format(result: AnalysisResult): string;
}

/**
 * Formatter that outputs results as a JSON string.
 */
export class JsonFormatter implements OutputFormatter {
  format(result: AnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }
}

/**
 * Formatter that outputs results as CSS @font-face overrides.
 */
export class CssFormatter implements OutputFormatter {
  format(result: AnalysisResult): string {
    const { fontName, metrics } = result;
    return `@font-face {\n  font-family: '${fontName}';\n  size-adjust: ${metrics.sizeAdjust}%;\n}`;
  }
}

/**
 * Factory to retrieve the appropriate formatter based on format type.
 * @param format The desired output format ('json' | 'css').
 * @returns An implementation of OutputFormatter.
 * @throws {Error} If the requested format is unsupported.
 */
export function getFormatter(format: string): OutputFormatter {
  if (format === 'json') return new JsonFormatter();
  if (format === 'css') return new CssFormatter();
  throw new Error(`Unsupported output format: ${format}`);
}
