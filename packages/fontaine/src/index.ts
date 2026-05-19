import { readFile, writeFile } from 'node:fs/promises';
import { ofetch } from 'ofetch';
import { FontaineTransform, type FontaineTransformOptions } from './transform.js';
import { FontaineMetrics } from './metrics.js';
import { FontaineFallbacks } from './fallbacks.js';

export { FontaineTransform, FontaineMetrics, FontaineFallbacks };

/**
 * Transforms a CSS file by adding font metrics-based fallbacks.
 * Supports both local file paths and remote HTTPS URLs.
 * 
 * @param inputPath - Path or URL to the source CSS file.
 * @param outputPath - Local path where the transformed CSS will be written.
 * @param options - Transformation configuration.
 * @returns A promise that resolves when the file has been written.
 */
export async function transformCssFile(inputPath: string, outputPath: string, options: FontaineTransformOptions = { fallbacks: [] }) {
  let cssContent: string;

  if (inputPath.startsWith('http')) {
    cssContent = await ofetch(inputPath, { responseType: 'text' });
  } else {
    cssContent = await readFile(inputPath, 'utf8');
  }

  const transformer = (FontaineTransform as any).raw(options);
  const result = await transformer.transform.handler(cssContent, inputPath);
  
  const transformedCode = typeof result === 'string' ? result : result?.code || cssContent;
  await writeFile(outputPath, transformedCode);
}
