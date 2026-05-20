import { readFile } from 'node:fs/promises';
import { FontaineFetchError } from './errors.js';

export interface ResolverOptions {
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Resolves a font resource from either a local filesystem path or a remote URL
 * into a unified Uint8Array.
 */
export class FontSourceResolver {
  /**
   * Resolves the provided source to a binary buffer.
   * @param source - The local path or HTTPS URL of the font.
   * @param options - Configuration for timeouts and cancellation.
   */
  async resolve(source: string, options: ResolverOptions = {}): Promise<Uint8Array> {
    const { timeout = 10000, signal } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const combinedSignal = signal 
        ? AbortSignal.any([signal, controller.signal]) 
        : controller.signal;

      if (source.startsWith('http')) {
        return await this.fetchRemote(source, combinedSignal);
      }

      return await this.readLocal(source);
    } catch (error) {
      throw new FontaineFetchError(source, error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async fetchRemote(url: string, signal: AbortSignal): Promise<Uint8Array> {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  async readLocal(path: string): Promise<Uint8Array> {
    return new Uint8Array(await readFile(path));
  }
}
