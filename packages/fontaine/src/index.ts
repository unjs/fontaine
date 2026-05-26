export * from './errors.js';
export * from './pipeline.js';
export * from './formatter.js';
export * from './resolver.js';

export interface AnalysisOptions {
  source: string;
  strict: boolean;
}

export interface AnalysisResult {
  fontName: string;
  metric: string;
  value: number;
  status: string;
}
