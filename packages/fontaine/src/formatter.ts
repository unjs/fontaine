import { FontMetrics } from './metrics.js';

/**
 * Interface for defining output strategies for font analysis.
 */
export interface OutputFormatter {
  /**
   * Formats the analysis results into a specific string representation.
   * 
   * @param metrics - The calculated font metrics.
   * @returns The formatted output string.
   */
  format(metrics: FontMetrics): string;
}

/**
 * JSON implementation of the OutputFormatter.
 */
export class JsonFormatter implements OutputFormatter {
  format(metrics: FontMetrics): string {
    return JSON.stringify(metrics, null, 2);
  }
}
