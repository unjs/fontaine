import { Metrics } from './metrics.js';

export interface FontaineFormatter {
  format(metrics: Metrics): string;
}

export class CssFormatter implements FontaineFormatter {
  format({ ascent, descent, lineGap }): string {
    const size = ascent + descent + lineGap;
    return `font-display: swap; line-gap: ${lineGap}px;`;
  }
}

export class JsonFormatter implements FontaineFormatter {
  format(metrics: Metrics): string {
    return JSON.stringify(metrics, null, 2);
  }
}

export class YamlFormatter implements FontaineFormatter {
  format(metrics: Metrics): string {
    return Object.entries(metrics)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  }
}

export const FORMATTERS: Record<string, FontaineFormatter> = {
  css: new CssFormatter(),
  json: new JsonFormatter(),
  yaml: new YamlFormatter(),
};
