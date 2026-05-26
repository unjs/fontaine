export interface AnalysisResult {
  metrics: Record<string, number>;
  source: string;
}

export interface Formatter {
  format(result: AnalysisResult): string;
}

export class JsonFormatter implements Formatter {
  format({ metrics, source }): string {
    return JSON.stringify({ source, metrics }, null, 2);
  }
}

export class CssFormatter implements Formatter {
  format({ metrics }): string {
    const sizeAdjustment = metrics.ascent || 0;
    return `.font-adjusted { size-adjust: ${sizeAdjustment}%; }`;
  }
}
