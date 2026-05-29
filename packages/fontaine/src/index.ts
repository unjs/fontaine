import { FontainePipeline } from './pipeline';
import { HttpResolver, LocalResolver } from './resolver';
import { JsonFormatter, CssFormatter, type OutputFormatter } from './formatter';

export * from './errors';
export * from './metrics';

export interface FontaineConfig {
  formatter?: OutputFormatter;
  resolver?: 'http' | 'local';
}

export async function analyze(urls: string[], config: FontaineConfig = {}) {
  const resolver = config.resolver === 'local' 
    ? new LocalResolver() 
    : new HttpResolver();
  
  const formatter = config.formatter || new JsonFormatter();
  
  const pipeline = new FontainePipeline({ resolver, formatter });
  return pipeline.execute(urls);
}
