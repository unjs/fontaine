import { AnalysisResult } from './metrics.js';

export interface OutputFormatter {
  format(result: AnalysisResult): string;
}

/**
 * Outputs analysis results as a JSON string for programmatic consumption.
 */
export class JSONFormatter implements OutputFormatter {
  format(result: AnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }
}

/**
 * Outputs analysis results as CSS @font-face overrides.
 * Used to inject calculated size-adjust or ascent-override values.
 */
export class CSSFormatter implements OutputFormatter {
  format({ family, metrics }): string {
    return `@font-face {\n  font-family: "${family}";\n  size-adjust: ${metrics.sizeAdjust}%;\n}\n`;
  }
}

export function createFormatter(format: 'json' | 'css'): OutputFormatter {
  return format === 'css' ? new CSSFormatter() : new JSONFormatter();
}
