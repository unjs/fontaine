import { FontSourceResolver } from './resolver.js';
import { analyzeFontBuffer } from './metrics.js';
import { AnalysisResult } from './formatter.js';

/**
 * Programmatic API for analyzing fonts without the CLI wrapper.
 * 
 * @param sources - Array of local paths or URLs.
 * @param options - Resolver configuration.
 */
export async function analyzeFonts(
  sources: string[], 
  options: { timeout?: number } = {}
): Promise<AnalysisResult[]> {
  const resolver = new FontSourceResolver();
  
  const results = await Promise.all(
    sources.map(async (source) => {
      const buffer = await resolver.resolve(source, options);
      const fontName = source.split('/').pop()?.split('.')[0] ?? 'Unknown';
      const metrics = await analyzeFontBuffer(buffer, fontName);
      
      return {
        fontName,
        metrics,
        timestamp: new Date().toISOString(),
      };
    })
  );

  return results;
}

export * from './errors.js';
export * from './resolver.js';
export * from './formatter.js';
