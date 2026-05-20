import type { FontMetrics } from './metrics.js';

export interface OutputFormatter {
  format(metrics: FontMetrics): string;
}

/**
 * Formats font metrics into a JSON string for programmatic consumption.
 */
export class JsonFormatter implements OutputFormatter {
  format(metrics: FontMetrics): string {
    return JSON.stringify(metrics, null, 2);
  }
}

/**
 * Formats font metrics into CSS override rules.
 */
export class CssFormatter implements OutputFormatter {
  format(metrics: FontMetrics): string {
    const { ascent, descent, lineGap } = metrics;
    return `.fontaine-override {\n  size-adjust: ${metrics.sizeAdjust}%;\n  ascent-override: ${ascent}%;\n  descent-override: ${descent}%;\n  line-gap-override: ${lineGap}%;\n}`;
  }
}
