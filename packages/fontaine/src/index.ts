import { FontainePipeline, FontaineOptions } from './pipeline.js';
import { ResourceSource } from './resolver.js';
import { 
  FontaineError, 
  FontaineFetchError, 
  FontaineAnalysisError, 
  FontaineInvalidContentTypeError 
} from './errors.js';

export { 
  FontaineError, 
  FontaineFetchError, 
  FontaineAnalysisError, 
  FontaineInvalidContentTypeError 
};
export type { FontaineOptions, ResourceSource };

/**
 * Programmatic entry point for font metric analysis.
 */
export async function fontaine(source: ResourceSource, options: FontaineOptions = {}): Promise<string> {
  const pipeline = new FontainePipeline(options);
  return pipeline.run(source);
}
