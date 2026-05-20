import type { FontMetrics } from './metrics.js';

/**
 * Formats font metrics into a CSS @font-face override string.
 * 
 * @param metrics - The analyzed font metrics.
 * @returns A CSS string for size-adjust and ascent-override.
 */
export function formatToCss(metrics: FontMetrics): string {
  return `size-adjust: ${metrics.sizeAdjust}%; ascent-override: ${metrics.ascentOverride}%; descent-override: ${metrics.descentOverride}%;`;
}

/**
 * Formats font metrics into a structured JSON object.
 * 
 * @param metrics - The analyzed font metrics.
 * @returns A JSON string representation of the metrics.
 */
export function formatToJson(metrics: FontMetrics): string {
  return JSON.stringify(metrics, null, 2);
}
