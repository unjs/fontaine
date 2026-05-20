export * from './errors';
export * from './pipeline';
export * from './resolver';
export * from './metrics';
export * from './formatter';

import { AnalysisPipeline } from './pipeline';

export async function analyzeFont(url: string, options = {}) {
  const pipeline = new AnalysisPipeline();
  return pipeline.run(url, options);
}
