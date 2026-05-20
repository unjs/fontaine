import { Resolver } from './resolver.js';
import { OutputFormatter, JsonFormatter } from './formatter.js';
import { analyzeFont } from './url-analyzer.js';
import { AnalysisError } from './errors.js';

export interface PipelineOptions {
  formatter?: OutputFormatter;
}

/**
 * Core pipeline coordinating resource resolution, analysis, and formatting.
 */
export async function runPipeline(
  source: string,
  options: PipelineOptions = {}
): Promise<string> {
  const resolver = new Resolver();
  const formatter = options.formatter ?? new JsonFormatter();

  const buffer = await resolver.resolve(source);
  
  try {
    const metrics = await analyzeFont(buffer);
    return formatter.format(metrics);
  } catch (error: any) {
    throw new AnalysisError(`Analysis phase failed: ${error.message}`);
  }
}
