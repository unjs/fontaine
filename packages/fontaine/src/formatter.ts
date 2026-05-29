export interface AnalysisResult {
  metrics: Record<string, number>;
  fontFamily: string;
  source: string;
}

export interface Formatter {
  format(result: AnalysisResult): string;
}

export class JsonFormatter implements Formatter {
  format(result: AnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }
}

export class CssFormatter implements Formatter {
  format(result: AnalysisResult): string {
    const { fontFamily, source } = result;
    return `@font-face {\n  font-family: '${fontFamily}';\n  src: url('${source}');\n}`;
  }
}
