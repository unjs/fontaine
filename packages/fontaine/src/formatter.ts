export interface AnalysisResult {
  url: string;
  metrics: any;
  timestamp: string;
}

/**
 * Formats analysis results into the requested output style.
 */
export function formatOutput(result: AnalysisResult, format: 'json' | 'css'): string {
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }

  const { metrics } = result;
  return `.font-metrics { --ascent: ${metrics.ascent}; --descent: ${metrics.descent}; }`;
}
