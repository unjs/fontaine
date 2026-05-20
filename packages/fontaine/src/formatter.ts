import { AnalysisResult } from './metrics.js';

/**
 * Interface for translating analysis results into specific output formats.
 */
export interface OutputFormatter {
  format(result: AnalysisResult): string;
}

/**
 * Outputs results as a structured JSON string.
 */
export class JsonFormatter implements OutputFormatter {
  format(result: AnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }
}

/**
 * Outputs results as a CSS @font-face override block.
 */
export class CssFormatter implements OutputFormatter {
  format(result: AnalysisResult): string {
    return `@font-face {\n  font-family: '${result.family}';\n  size-adjust: ${result.sizeAdjust}%;\n}`;
  }
}
