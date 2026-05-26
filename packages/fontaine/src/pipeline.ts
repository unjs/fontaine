import { FontResolver } from './resolver.js';
import { FontValidator } from './validator.js';
import { Formatter } from './formatter.js';
import { analyzeFont } from './url-analyzer.js';
import { Metrics } from './metrics.js';

/**
 * Coordinates the font analysis workflow from retrieval to formatting.
 */
export class FontainePipeline {
  constructor(
    private resolver = new FontResolver(),
    private validator = new FontValidator(),
  ) {}

  /**
   * Executes the full analysis pipeline.
   * @example
   * const pipeline = new FontainePipeline();
   * const result = await pipeline.run('font.ttf', new CssFormatter());
   * @param source Location of the font.
   * @param formatter Strategy for output formatting.
   */
  async run(source: string, formatter: Formatter): Promise<string> {
    const { buffer, contentType } = await this.resolver.resolve(source);
    this.validator.validate(contentType, buffer);
    
    const metrics: Metrics = await analyzeFont(buffer);
    return formatter.format(metrics);
  }
}
