import { readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { FontaineTransformError } from './errors.js';

export async function atomicTransformCss(filePath: string, transformFn: (content: string) => string): Promise<void> {
  const atomicPath = `${filePath}.atomic.${Math.random().toString(36).slice(2)}.tmp`;
  
  try {
    const content = await readFile(filePath, 'utf8');
    const result = transformFn(content);
    
    await writeFile(atomicPath, result, 'utf8');
    await rename(atomicPath, filePath);
  } catch (error) {
    throw new FontaineTransformError(error instanceof Error ? error.message : 'Atomic write failed');
  }
}
