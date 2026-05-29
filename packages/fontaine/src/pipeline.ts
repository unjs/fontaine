import { createResolver } from './resolver.js';
import { createFormatter } from './formatter.js';
import { analyzeFont } from './url-analyzer.js';
import { AnalysisResult } from './metrics.js';

export async function runAnalysis(source: string, format: 'json' | 'css' = 'json'): Promise<string> {
  const resolver = createResolver(source);
  const formatter = createFormatter(format);
  
  const buffer = await resolver.resolve(source);
  const result: AnalysisResult = await analyzeFont(buffer);
  
  return formatter.format(result);
}
