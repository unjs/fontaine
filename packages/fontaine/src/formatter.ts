import { FontaineFormatterError } from './errors.js';

export interface OutputFormatter {
  format(data: any): string;
}

export class JsonFormatter implements OutputFormatter {
  format(data: any): string {
    return JSON.stringify(data, null, 2);
  }
}

export class CssFormatter implements OutputFormatter {
  format(data: any): string {
    // Logic simplified for architectural demonstration
    return `/* Fontaine Analysis */\n:root { --font-metrics: ${JSON.stringify(data)}; }`;
  }
}

const FORMATTERS: Record<string, OutputFormatter> = {
  json: new JsonFormatter(),
  css: new CssFormatter(),
};

/**
 * Returns the appropriate formatter based on the requested format.
 * @param format - The format key ('json' | 'css').
 * @throws {FontaineFormatterError} If the format is unsupported.
 */
export function getFormatter(format: string): OutputFormatter {
  const formatter = FORMATTERS[format];
  if (!formatter) {
    throw new FontaineFormatterError(`Unsupported output format: ${format}`);
  }
  return formatter;
}
