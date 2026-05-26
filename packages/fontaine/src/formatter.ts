export interface FontMetrics {
  ascent: number;
  descent: number;
  lineGap: number;
}

export type OutputFormat = 'css' | 'json';

export function formatAnalysis(metrics: FontMetrics, format: OutputFormat = 'css'): string {
  if (format === 'json') {
    return JSON.stringify({ metrics }, null, 2);
  }

  const { ascent, descent, lineGap } = metrics;
  const size = ascent + Math.abs(descent) + lineGap;
  
  return `@font-face {
  size-adjust: ${size}%;
}`;
}
