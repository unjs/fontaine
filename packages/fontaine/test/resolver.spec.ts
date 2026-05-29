import { describe, it, expect, vi } from 'vitest';
import { LocalResolver, RemoteResolver, InvalidContentTypeError } from '../src/resolver.js';
import { readFile } from 'node:fs/promises';

vi.mock('node:fs/promises');

describe('FontResolver Matrix', () => {
  describe('LocalResolver', () => {
    it('should resolve existing local files', async () => {
      (readFile as any).mockResolvedValue(Buffer.from('fake-font-binary'));
      const resolver = new LocalResolver();
      const result = await resolver.resolve('/path/to/font.ttf');
      expect(result.toString()).toBe('fake-font-binary');
    });
  });

  describe('RemoteResolver', () => {
    it('should throw InvalidContentTypeError for non-font types', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'text/html' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });
      const resolver = new RemoteResolver();
      await expect(resolver.resolve('https://example.com/not-a-font')).rejects.toThrow(InvalidContentTypeError);
    });

    it('should resolve valid remote fonts', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'font/woff2' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });
      const resolver = new RemoteResolver();
      const result = await resolver.resolve('https://example.com/font.woff2');
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
