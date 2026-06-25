import { FontMetrics } from './metrics.js';

/**
 * Strategy interface for font metric serialization.
 */
export interface FontFormatter {
  format(metrics: FontMetrics): string;
}

/**
 * Formats font metrics as a JSON string.
 */
export class JsonFormatter implements FontFormatter {
  format(metrics: FontMetrics): string {
    return JSON.stringify(metrics, null, 2);
  }
}

/**
 * Formats font metrics as CSS override variables.
 */
export class CssFormatter implements FontFormatter {
  format(metrics: FontMetrics): string {
    const { ascent, descent } = metrics;
    return `:root {\n  --font-ascent: ${ascent};\n  --font-descent: ${descent};\n}`;
  }
}
