import { resolveAsset } from './resolver.js';
import { Formatter, AnalysisResult } from './formatter.js';

export interface PipelineOptions {
  formatter: Formatter;
}

export async function runAnalysis(url: string, { formatter }: PipelineOptions): Promise<string> {
  const { buffer } = await resolveAsset(url);
  
  // Logic for calculating metrics would reside in metrics.ts
  const metrics = { ascent: 100, descent: 20 }; 
  
  const result: AnalysisResult = {
    metrics,
    source: url,
  };

  return formatter.format(result);
}
