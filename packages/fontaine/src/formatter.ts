import type { FontMetrics } from './metrics';

export type FormatterFn = (metrics: FontMetrics) => string;

export class FormatterRegistry {
  private static formats = new Map<string, FormatterFn>();

  static register(format: string, fn: FormatterFn) {
    this.formats.set(format, fn);
  }

  static get(format: string): FormatterFn {
    const formatter = this.formats.get(format);
    if (!formatter) {
      throw new Error(`Unsupported output format: ${format}`);
    }
    return formatter;
  }

  static availableFormats(): string[] {
    return Array.from(this.formats.keys());
  }
}

FormatterRegistry.register('json', (metrics) => JSON.stringify(metrics, null, 2));
FormatterRegistry.register('text', (metrics) => `Font Metrics: ${metrics.ascent} / ${metrics.descent}`);
