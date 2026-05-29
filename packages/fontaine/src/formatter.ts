import { FontMetrics } from './metrics.js';

export interface OutputFormatter {
  format(metrics: FontMetrics): string;
}

export class JsonFormatter implements OutputFormatter {
  format(metrics: FontMetrics): string {
    return JSON.stringify(metrics, null, 2);
  }
}

export class CssFormatter implements OutputFormatter {
  format(metrics: FontMetrics): string {
    const size = metrics.ascent - metrics.descent;
    return `.fontaine-metrics { --font-ascent: ${metrics.ascent}; --font-descent: ${metrics.descent}; --font-size: ${size}; }`;
  }
}
