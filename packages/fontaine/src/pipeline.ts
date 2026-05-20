import { resolveResource, ResourceSource } from './resolver.js';
import { analyzeFont } from './transform.js';
import { OutputFormatter, CssFormatter, JsonFormatter } from './formatter.js';
import { FontMetrics } from './metrics.js';

export interface FontaineOptions {
  format?: 'css' | 'json';
}

export class FontainePipeline {
  private formatter: OutputFormatter;

  constructor(options: FontaineOptions = {}) {
    this.formatter = options.format === 'json' 
      ? new JsonFormatter() 
      : new CssFormatter();
  }

  /**
   * Orchestrates the resolution, analysis, and formatting of font metrics.
   */
  async run(source: ResourceSource): Promise<string> {
    const binary = await resolveResource(source);
    const metrics = await analyzeFont(binary);
    return this.formatter.format(metrics);
  }
}
