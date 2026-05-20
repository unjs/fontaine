import type { AnalysisResult } from './index.js';

/**
 * Interface for transforming analysis results into specific string formats.
 */
export interface FontFormatter {
  format(result: AnalysisResult): string;
}

export class CssFormatter implements FontFormatter {
  format(result: AnalysisResult): string {
    const { fontName, overrides } = result;
    const rules = Object.entries(overrides)
      .map(([size, value]) => `@font-face { font-family: "${fontName}"; font-size: ${size}; size-adjust: ${value}; }`)
      .join('\n');
    return rules;
  }
}

export class JsonFormatter implements FontFormatter {
  format(result: AnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }
}

export class FormatterFactory {
  static getFormatter(type: 'css' | 'json'): FontFormatter {
    if (type === 'json') return new JsonFormatter();
    return new CssFormatter();
  }
}
