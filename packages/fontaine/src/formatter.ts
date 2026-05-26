import { Metrics } from './metrics.js';

export interface Formatter {
  format(metrics: Metrics): string;
}

/**
 * Formats font metrics as a CSS @font-face override.
 */
export class CssFormatter implements Formatter {
  format({ ascent, descent, lineGap }: Metrics): string {
    return `line-gap: ${lineGap}px;`;
  }
}

/**
 * Formats font metrics as a structured JSON string.
 */
export class JsonFormatter implements Formatter {
  format(metrics: Metrics): string {
    return JSON.stringify(metrics, null, 2);
  }
}

export type FormatterType = 'css' | 'json';

export function createFormatter(type: FormatterType): Formatter {
  const formatters: Record<FormatterType, Formatter> = {
    css: new CssFormatter(),
    json: new JsonFormatter(),
  };
  return formatters[type];
}
