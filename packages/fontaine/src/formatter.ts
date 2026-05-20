export interface AnalysisResult {
  fontName: string;
  metrics: Record<string, number>;
  timestamp: string;
}

export interface OutputFormatter {
  format(results: AnalysisResult[]): string;
}

/**
 * Formats analysis results as a JSON string.
 */
export class JSONFormatter implements OutputFormatter {
  format(results: AnalysisResult[]): string {
    return JSON.stringify(results, null, 2);
  }
}

/**
 * Formats analysis results as CSS overrides.
 */
export class CSSFormatter implements OutputFormatter {
  format(results: AnalysisResult[]): string {
    return results
      .map(({ fontName, metrics }) => {
        const sizeAdjust = metrics.sizeAdjust ?? 100;
        return `@font-face {\n  font-family: '${fontName}';\n  size-adjust: ${sizeAdjust}%;\n}`;
      })
      .join('\n\n');
  }
}
