import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { os } from 'node:os';

export interface CacheEntry {
  metrics: any;
  timestamp: number;
  hash: string;
}

export class FontCache {
  private cacheDir = join(os.homedir(), '.cache', 'fontaine');

  constructor() {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private getCachePath(url: string) {
    const hash = Buffer.from(url).toString('base64url');
    return join(this.cacheDir, `${hash}.json`);
  }

  async get(url: string): Promise<CacheEntry | null> {
    const path = this.getCachePath(url);
    if (!existsSync(path)) return null;
    
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return null;
    }
  }

  async set(url: string, metrics: any, hash: string): Promise<void> {
    const path = this.getCachePath(url);
    const entry: CacheEntry = {
      metrics,
      timestamp: Date.now(),
      hash,
    };
    writeFileSync(path, JSON.stringify(entry));
  }
}
