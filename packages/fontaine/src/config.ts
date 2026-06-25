import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface FontaineConfig {
  cacheEnabled: boolean;
  outputFormat: 'json' | 'css' | 'text';
  dryRun: boolean;
  defaultFallbacks: string[];
}

export function loadConfig(): Partial<FontaineConfig> {
  const configPaths = [
    join(process.cwd(), '.fontainerc.json'),
    join(process.cwd(), 'fontaine.config.json'),
  ];

  for (const path of configPaths) {
    if (existsSync(path)) {
      try {
        return JSON.parse(readFileSync(path, 'utf-8'));
      } catch {
        continue;
      }
    }
  }
  return {};
}
