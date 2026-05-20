import { resolveFontSource } from './url-analyzer';
import { transform } from './transform';
import { FontaineError } from './errors';

/**
 * Programmatic API for font transformation.
 * Supports local paths and remote URLs.
 * 
 * @param input - Path or URL to the source font.
 * @param options - Transformation configuration.
 * @returns The transformed font result.
 * @throws {FontaineError} For domain-specific failures.
 */
export async function fontaine(input: string, options: any = {}) {
  const buffer = await resolveFontSource(input);
  return transform(buffer, options);
}

export * from './errors';
export * from './metrics';
