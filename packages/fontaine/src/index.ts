import { readFile, writeFile } from 'node:fs/promises';
import { FontaineTransform } from './transform.js';
import { FontaineMetrics } from './metrics.js';
import { FontaineFallbacks } from './fallbacks.js';

export { FontaineTransform, FontaineMetrics, FontaineFallbacks };

export async function transformCssFile(inputPath: string, outputPath: string, options: any = {}) {
  const cssContent = await readFile(inputPath, 'utf8');
  const transformer = new FontaineTransform(options);
  const result = transformer.transform(cssContent);
  await writeFile(outputPath, result);
}
