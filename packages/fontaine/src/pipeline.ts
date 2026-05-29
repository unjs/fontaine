import { FontSourceResolver } from './resolver.js';
import { createFormatter, type Formatter } from './formatter.js';
import { analyze } from './metrics.js';
import { AnalysisError } from './errors.js';

export interface PipelineOptions {
  format: 'json' | 'css';
}

export async function runFontainePipeline(source: string, options: PipelineOptions) {
  const resolver = new FontSourceResolver();
  const formatter: Formatter = createFormatter(options.format);

  const buffer = await resolver.resolve(source);
  
  try {
    const metrics = analyze(buffer);
    return formatter.format(metrics);
  } catch (err: any) {
    throw new AnalysisError(`Analysis failed: ${err.message}`);
  }
}
