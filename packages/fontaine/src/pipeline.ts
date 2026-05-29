import { Resolver } from './resolver';
import { analyzeFont } from './url-analyzer';
import { OutputFormatter } from './formatter';
import type { FontMetrics } from './metrics';

export interface PipelineOptions {
  resolver: Resolver;
  formatter: OutputFormatter;
}

export class FontainePipeline {
  constructor(private options: PipelineOptions) {}

  async process(urls: string[]): Promise<{
    results: Array<{ url: string; status: 'fulfilled'; value: FontMetrics }>;
    errors: Array<{ url: string; status: 'rejected'; reason: Error }>;
  }> {
    const tasks = urls.map(async (url) => {
      try {
        const buffer = await this.options.resolver.resolve(url);
        const metrics = await analyzeFont(buffer, url);
        return { url, status: 'fulfilled' as const, value: metrics };
      } catch (error) {
        return { url, status: 'rejected' as const, reason: error as Error };
      }
    });

    const settled = await Promise.allSettled(tasks);
    
    const results: any[] = [];
    const errors: any[] = [];

    settled.forEach((res, idx) => {
      if (res.status === 'fulfilled') {
        const item = res.value;
        if (item.status === 'fulfilled') results.push(item);
        else errors.push(item);
      } else {
        errors.push({ url: urls[idx], status: 'rejected', reason: res.reason });
      }
    });

    return { results, errors };
  }

  async execute(urls: string[]): Promise<string> {
    const { results } = await this.process(urls);
    const metrics = results.map(r => r.value);
    return this.options.formatter.format(metrics);
  }
}
