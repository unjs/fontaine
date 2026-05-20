import { AnalysisResult } from './metrics.js';

/**
 * Strategy interface for formatting font analysis results.
 */
export interface OutputFormatter {
  /**
   * Formats the analysis result into the target string representation.
   * 
   * @param result - The metrics produced by the analyzer.
   * @returns The formatted output string.
   */
  format(result: AnalysisResult): string;
}

/**
 * Formats results as a JSON string for programmatic consumption.
 */
export class JsonFormatter implements OutputFormatter {
  format(result: AnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }
}

/**
 * Formats results as CSS @font-face override properties.
 */
export class CssFormatter implements OutputFormatter {
  format(result: AnalysisResult): string {
    const { ascent, descent, linegap } = result;
    return `size-adjust: ${result.sizeAdjust}%;\nascent-override: ${ascent}%;\n\ndescent-override: ${descent}%;`;
  }
}
