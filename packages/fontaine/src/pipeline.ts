import { defu } from 'defu';
import { SourceResolver } from './resolver';
import { MetricExtractor } from './metrics';
import { OutputFormatter, FormatType } from './formatter';

interface PipelineOptions {
  format?: FormatType;
}

export class AnalysisPipeline {
  private resolver = new SourceResolver();
  private extractor = new MetricExtractor();
  private formatter = new OutputFormatter();

  async run(url: string, options: PipelineOptions = {}): Promise<string> {
    const config = defu(options, { format: 'css' });
    
    const buffer = await this.resolver.resolve(url);
    const metrics = this.extractor.analyze(buffer);
    return this.formatter.format(metrics, config.format);
  }
}
