import { readFile } from 'node:fs/promises';
import { FetchError } from './errors.js';
import { validateFont } from './validator.js';

export interface SourceResolver {
  resolve(source: string | Buffer | Uint8Array): Promise<Uint8Array>;
}

class LocalResolver implements SourceResolver {
  async resolve(source: string): Promise<Uint8Array> {
    try {
      const buffer = await readFile(source);
      const uint8 = new Uint8Array(buffer);
      await validateFont(uint8);
      return uint8;
    } catch (error) {
      throw new FetchError(`Failed to read local file: ${source}`, source);
    }
  }
}

class HttpResolver implements SourceResolver {
  async resolve(source: string): Promise<Uint8Array> {
    try {
      const response = await fetch(source);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const contentType = response.headers.get('Content-Type');
      const buffer = await response.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      
      await validateFont(uint8, contentType);
      return uint8;
    } catch (error) {
      throw new FetchError(`Failed to fetch remote font: ${source}`, source);
    }
  }
}

class BufferResolver implements SourceResolver {
  async resolve(source: Buffer | Uint8Array): Promise<Uint8Array> {
    const uint8 = source instanceof Uint8Array ? source : new Uint8Array(source);
    await validateFont(uint8);
    return uint8;
  }
}

export class FontResolver {
  private resolvers: Map<string, SourceResolver> = new Map();

  constructor() {
    this.resolvers.set('local', new LocalResolver());
    this.resolvers.set('http', new HttpResolver());
    this.resolvers.set('buffer', new BufferResolver());
  }

  /**
   * Resolves a font source into a Uint8Array.
   * 
   * @example
   * const resolver = new FontResolver();
   * const buffer = await resolver.resolve('https://fonts.com/font.woff2');
   */
  async resolve(source: string | Buffer | Uint8Array): Promise<Uint8Array> {
    if (source instanceof Uint8Array || Buffer.isBuffer(source)) {
      return this.resolvers.get('buffer')!.resolve(source);
    }

    if (source.startsWith('http://') || source.startsWith('https://')) {
      return this.resolvers.get('http')!.resolve(source);
    }

    return this.resolvers.get('local')!.resolve(source);
  }
}
