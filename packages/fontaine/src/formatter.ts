import { FontMetrics } from './metrics.js';

export interface OutputFormatter {
  format(metrics: FontMetrics): string;
}

/**
 * Formats font metrics as a CSS @font-face override.
 */
export class CssFormatter implements OutputFormatter {
  format({ ascent, descent, lineGap }: FontMetrics): string {
    return `size-adjust: ${ascent + descent + lineGap}%;`;
  }
}

/**
 * Formats font metrics as a JSON string for programmatic consumption.
 */
export class JsonFormatter implements OutputFormatter {
  format(metrics: FontMetrics): string {
    return JSON.stringify(metrics, null, 2);
  }
}
