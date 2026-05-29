import type { FontMetrics } from './metrics';

export interface OutputFormatter<T = any> {
  format(data: T): string;
}

export class JsonFormatter implements OutputFormatter<FontMetrics[]> {
  format(data: FontMetrics[]): string {
    return JSON.stringify(data, null, 2);
  }
}

export class CssFormatter implements OutputFormatter<FontMetrics[]> {
  format(data: FontMetrics[]): string {
    return data
      .map(({ name, metrics }) => {
        // Generate size-adjust and ascent-override based on analysis
        return `@font-face {
  font-family: "${name}";
  size-adjust: ${metrics.sizeAdjust}%;
  ascent-override: ${metrics.ascentOverride}%;
}`;
      })
      .join('\n');
  }
}
