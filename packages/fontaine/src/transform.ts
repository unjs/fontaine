import { FontMetrics } from './metrics.js';

/**
 * Generates CSS overrides based on provided font metrics.
 */
export function generateCSS(name: string, metrics: FontMetrics): string {
  return `@font-face {\n  font-family: '${name}';\n  size-adjust: ${metrics.sizeAdjust}%;\n}`;
}
