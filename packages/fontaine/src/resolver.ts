import fs from 'node:fs/promises';
import { ofetch } from 'ofetch';
import { FontaineFetchError, FontaineInvalidContentTypeError } from './errors.js';

export interface Resource {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Strategy for resolving font resources from various protocols.
 */
export interface FontResolver {
  supports(url: string): boolean;
  resolve(url: string): Promise<Resource>;
}

export class FileSystemResolver implements FontResolver {
  supports(url: string): boolean {
    return url.startsWith('file://') || !url.includes('://');
  }

  async resolve(url: string): Promise<Resource> {
    try {
      const path = url.startsWith('file://') ? url.replace('file://', '') : url;
      const buffer = await fs.readFile(path);
      return {
        buffer,
        mimeType: 'application/octet-stream',
      };
    } catch (error) {
      throw new FontaineFetchError(url, error);
    }
  }
}

export class HttpResolver implements FontResolver {
  supports(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
  }

  async resolve(url: string): Promise<Resource> {
    try {
      const response = await ofetch.raw(url);
      const contentType = response.headers.get('content-type') || '';

      if (!this.isValidFontType(contentType)) {
        throw new FontaineInvalidContentTypeError(url, contentType);
      }

      const buffer = await response.blob().then((b) => b.arrayBuffer());
      return {
        buffer: Buffer.from(buffer),
        mimeType: contentType,
      };
    } catch (error) {
      if (error instanceof FontaineInvalidContentTypeError) throw error;
      throw new FontaineFetchError(url, error);
    }
  }

  private isValidFontType(mimeType: string): boolean {
    const validTypes = [
      'font/ttf',
      'font/otf',
      'font/woff',
      'font/woff2',
      'application/font-sfnt',
      'application/vnd.ms-fontobject',
      'application/x-font-ttf',
    ];
    return validTypes.some((type) => mimeType.includes(type));
  }
}

/**
 * Orchestrates multiple resolvers to retrieve font data.
 */
export class ResolverRegistry {
  private resolvers: FontResolver[] = [];

  register(resolver: FontResolver): void {
    this.resolvers.push(resolver);
  }

  async resolve(url: string): Promise<Resource> {
    const resolver = this.resolvers.find((r) => r.supports(url));
    if (!resolver) {
      throw new FontaineError(`No resolver registered for URL: ${url}`);
    }
    return resolver.resolve(url);
  }
}
