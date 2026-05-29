import { ofetch } from 'ofetch';
import { FontaineFetchError, FontaineValidationError } from './errors';

export interface Resolver {
  resolve(url: string): Promise<Uint8Array>;
}

export class HttpResolver implements Resolver {
  async resolve(url: string): Promise<Uint8Array> {
    try {
      const response = await ofetch(url, {
        responseType: 'arrayBuffer',
        onResponse({ response }) {
          const contentType = response.headers.get('content-type') || '';
          const isValid = [
            'font/woff2',
            'application/font-woff2',
            'font/ttf',
            'application/x-font-ttf'
          ].some(type => contentType.includes(type));

          if (!isValid) {
            throw new FontaineValidationError(url, contentType);
          }
        }
      });
      return new Uint8Array(response as ArrayBuffer);
    } catch (err) {
      if (err instanceof FontaineValidationError) throw err;
      throw new FontaineFetchError(url, (err as Error).message);
    }
  }
}

export class LocalResolver implements Resolver {
  async resolve(path: string): Promise<Uint8Array> {
    try {
      const fs = await import('node:fs/promises');
      const buffer = await fs.readFile(path);
      return new Uint8Array(buffer);
    } catch (err) {
      throw new FontaineFetchError(path, (err as Error).message);
    }
  }
}
