import type { FontMetrics } from './metrics';

/**
 * Strategy interface for converting font metrics into a specific output format.
 */
export interface OutputFormatter {
  /**
   * Formats the provided metrics into a string.
   * @param metrics - The extracted font metrics.
   * @returns The formatted string output.
   */
  format(metrics: FontMetrics): string;
}

/**
 * Formats metrics as a JSON string.
 */
export class JsonFormatter implements OutputFormatter {
  format(metrics: FontMetrics): string {
    return JSON.stringify(metrics, null, 2);
  }
}

/**
 * Formats metrics as a CSS @font-face override or utility class.
 */
export class CssFormatter implements OutputFormatter {
  format(metrics: FontMetrics): string {
    const { ascent, descent, lineGap } = metrics;
    return `.font-metrics-adjusted {\n  line-height: ${ascent + descent + lineGap}px;\n}`;
  }
}

/**
 * Registry for available formatters to support extensibility.
 */
export const FORMATTERS: Record<string, new () => OutputFormatter> = {
  json: JsonFormatter,
  css: CssFormatter,
};
