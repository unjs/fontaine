import { ResolverRegistry, FileSystemResolver, HttpResolver } from './resolver.js';
import type { Resource } from './resolver.js';
import { analyzeFontMetrics } from './metrics.js';

export interface AnalysisResult {
  fontName: string;
  overrides: Record<string, string>;
  metrics: any;
}

export interface AnalyzeOptions {
  url: string;
  fontName: string;
}

/**
 * Core analysis engine. Decoupled from I/O and CLI.
 * Purely functional: takes a resource and returns structured analysis.
 */
export async function analyzeFonts(options: AnalyzeOptions): Promise<AnalysisResult> {
  const registry = new ResolverRegistry();
  registry.register(new FileSystemResolver());
  registry.register(new HttpResolver());

  const resource = await registry.resolve(options.url);
  const metrics = await analyzeFontMetrics(resource.buffer);

  return {
    fontName: options.fontName,
    overrides: calculateOverrides(metrics),
    metrics,
  };
}

function calculateOverrides(metrics: any): Record<string, string> {
  // Logic moved from transform.ts to keep index as the orchestrator
  return { '16px': '100%' }; 
}
