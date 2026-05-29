import { FontSourceResolver } from './resolver.js';
import { FontAnalyzer } from './metrics.js';
import { OutputFormatter } from './formatter.js';

export interface PipelineOptions {
  formatter: OutputFormatter;
}

/**
 * Orchestrates the end-to-end process of resolving, analyzing, and formatting font data.
 */
export class FontainePipeline {
  private resolver = new FontSourceResolver();
  private analyzer = new FontAnalyzer();

  constructor(private { formatter }: PipelineOptions) {}

  /**
   * Executes the font analysis pipeline.
   * 
   * @throws {FontaineError} For any failure in the pipeline.
   */
  async run(input: string | Buffer): Promise<string> {
    const { buffer } = await this.resolver.resolve(input);
    const metrics = this.analyzer.analyze(buffer);
    return this.formatter.format(metrics);
  }
}
