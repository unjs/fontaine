import { FontMetrics } from './metrics.js';

export interface OutputFormatter {
  format(metrics: FontMetrics): string;
}

export class JsonFormatter implements OutputFormatter {
  /**
   * Returns metrics as a JSON string.
   */
  format(metrics: FontMetrics): string {
    return JSON.stringify(metrics, null, 2);
  }
}

export class CssFormatter implements OutputFormatter {
  /**
   * Returns metrics as a CSS @font-face size-adjust rule.
   */
  format(metrics: FontMetrics): string {
    const sizeAdjust = (metrics.unitsPerEm / (metrics.ascent - metrics.descent)) * 100;
    return `size-adjust: ${sizeAdjust.toFixed(2)}%;`;
  }
}
