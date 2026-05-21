import { FontMetrics } from './metrics.js';

export interface TransformOptions {
  fallbackFont: string;
}

/**
 * Transforms CSS @font-face rules to include size-adjust and ascent-override.
 */
export function transformFontCss(css: string, metrics: FontMetrics, { fallbackFont }: TransformOptions): string {
  const ascentOverride = `${metrics.ascent / 1000}em`;
  const descentOverride = `${metrics.descent / 1000}em`;
  
  // Regex replaces font-face declarations with optimized overrides
  return css.replace(/(@font-face\s*\{[^}]*\})/g, (match) => {
    return `${match.replace('{', `{\n  ascent-override: ${ascentOverride};\n  descent-override: ${descentOverride};\n  size-adjust: 100%;`)}`;
  });
}
