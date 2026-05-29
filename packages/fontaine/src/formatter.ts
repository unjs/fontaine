import type { FontMetrics } from './metrics.js';

export interface Formatter {
  format(metrics: FontMetrics): string;
}

export class JsonFormatter implements Formatter {
  format(metrics: FontMetrics): string {
    return JSON.stringify(metrics, null, 2);
  }
}

export class CssFormatter implements Formatter {
  format(metrics: FontMetrics): string {
    const { ascent, descent, lineGap } = metrics;
    const size = ascent + descent + lineGap;
    return `font-size-adjust: ${((ascent - descent) / size).toFixed(3)};`;
  }
}

export function createFormatter(type: 'json' | 'css'): Formatter {
  if (type === 'json') return new JsonFormatter();
  return new CssFormatter();
}
