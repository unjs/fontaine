import { FontMetrics } from './metrics.js';

export type OutputFormat = 'json' | 'css';

export interface Formatter {
  format(metrics: FontMetrics): string;
}

class JSONFormatter implements Formatter {
  format(metrics: FontMetrics): string {
    return JSON.stringify(metrics, null, 2);
  }
}

class CSSFormatter implements Formatter {
  format(metrics: FontMetrics): string {
    const { ascent, descent, lineGap } = metrics;
    return `@font-face { font-display: swap; font-metrics: ${ascent} ${descent} ${lineGap}; }`;
  }
}

const formatters: Record<OutputFormat, Formatter> = {
  json: new JSONFormatter(),
  css: new CSSFormatter(),
};

/**
 * Returns the formatted output based on the requested strategy.
 * 
 * @param metrics - The analyzed font metrics.
 * @param format - The output format ('json' or 'css').
 */
export function formatMetrics(metrics: FontMetrics, format: OutputFormat): string {
  const formatter = formatters[format];
  return formatter.format(metrics);
}
