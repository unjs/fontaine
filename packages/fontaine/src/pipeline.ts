import { resolveFontSource } from './resolver';
import { analyzeFont } from './metrics';
import { OutputFormatter } from './formatter';
import type { FontMetrics } from './metrics';

/**
 * Orchestrates the process of fetching, analyzing, and formatting font data.
 */
export class FontainePipeline {
  /**
   * Process a font source and return the formatted result.
   * 
   * @param source - Font URI.
   * @param formatter - The strategy used to format the output.
   * @returns The formatted output string.
   * @throws {FontaineError} If any stage of the pipeline fails.
   */
  async process(source: string, formatter: OutputFormatter): Promise<string> {
    const buffer = await resolveFontSource(source);
    const metrics = await analyzeFont(buffer);
    return formatter.format(metrics);
  }
}
