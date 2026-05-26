import { AnalysisResult } from './metrics.js';

export interface OutputFormatter {
  format(result: AnalysisResult): string;
}

export class JsonFormatter implements OutputFormatter {
  format(result: AnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }
}

export class TextFormatter implements OutputFormatter {
  format(result: AnalysisResult): string {
    const lines = [
      `Font Analysis: ${result.fontName}`,
      `Metric: ${result.metric} -> ${result.value}`,
      `Status: ${result.status}`,
    ];
    return lines.join('\n');
  }
}

export class FormatterRegistry {
  private formatters = new Map<string, OutputFormatter>();

  constructor() {
    this.register('json', new JsonFormatter());
    this.register('text', new TextFormatter());
  }

  register(name: string, formatter: OutputFormatter): void {
    this.formatters.set(name, formatter);
  }

  get(name: string): OutputFormatter {
    const formatter = this.formatters.get(name);
    if (!formatter) {
      throw new Error(`Unsupported formatter: ${name}`);
    }
    return formatter;
  }
}

export const formatterRegistry = new FormatterRegistry();
