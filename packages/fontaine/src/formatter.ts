import { FontaineFormatterError } from './errors.js';

export interface AnalysisResult {
  ascent: number;
  descent: number;
  unitsPerEm: number;
  metrics: Record<string, number>;
}

export interface OutputFormatter {
  format(result: AnalysisResult): string;
}

export class JsonFormatter implements OutputFormatter {
  format(result: AnalysisResult): string {
    try {
      return JSON.stringify(result, null, 2);
    } catch (error) {
      throw new FontaineFormatterError(`JSON formatting failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export class CssFormatter implements OutputFormatter {
  format(result: AnalysisResult): string {
    try {
      const { ascent, descent } = result;
      const size = ascent - descent;
      return `/* Fontaine Analysis */\n:root {\n  --font-ascent: ${ascent}px;\n  --font-descent: ${descent}px;\n  --font-size: ${size}px;\n}`;
    } catch (error) {
      throw new FontaineFormatterError(`CSS formatting failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
