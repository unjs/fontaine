import { FontaineAnalysisResult } from './metrics.js';

export interface OutputFormatter {
  format(result: FontaineAnalysisResult): string;
}

/**
 * Formats analysis results as a JSON string.
 */
export class JsonFormatter implements OutputFormatter {
  format(result: FontaineAnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }
}

/**
 * Formats analysis results as a CSS @font-face override.
 */
export class CssFormatter implements OutputFormatter {
  format(result: FontaineAnalysisResult): string {
    const { ascent, descent, lineGap } = result;
    return `font-display: swap; line-gap: ${lineGap}px;`;
  }
}

/**
 * Factory to retrieve the appropriate formatter.
 * 
 * @param format - The desired output format ('json' | 'css').
 * @returns An implementation of OutputFormatter.
 */
export function getFormatter(format: string): OutputFormatter {
  if (format === 'css') return new CssFormatter();
  return new JsonFormatter();
}
