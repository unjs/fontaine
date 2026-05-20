import { OutputFormatter } from './formatter.js';
import { FontMetrics } from './metrics.js';

/**
 * Formats font metrics into a CSS variable block for size-adjust.
 */
export class CssFormatter implements OutputFormatter {
  /**
   * Generates CSS styles to mitigate layout shift.
   * 
   * @param metrics - The calculated font metrics.
   * @returns CSS string containing font-face overrides.
   */
  format(metrics: FontMetrics): string {
    return `
@font-face {
  font-family: "${metrics.family}";
  size-adjust: ${metrics.sizeAdjust}%;
  ascent-override: ${metrics.ascentOverride}%;
  descent-override: ${metrics.descentOverride}%;
}`;
  }
}
