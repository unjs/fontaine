import { describe, it, expect, vi } from 'vitest';
import { FontResolver } from '../src/resolver';
import { ofetch } from 'ofetch';
import { readFile } from 'node:fs/promises';
import { FontaineNetworkError, FontaineFileSystemError } from '../src/errors';

vi.mock('ofetch');
vi.mock('node:fs/promises');

describe('FontResolver', () => {
  const resolver = new FontResolver();

  it('should resolve remote fonts using ofetch', async () => {
    const mockBuffer = new ArrayBuffer(8);
    vi.mocked(ofetch).mockResolvedValue(mockBuffer);

    const result = await resolver.resolve('https://example.com/font.ttf');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(ofetch).toHaveBeenCalledWith('https://example.com/font.ttf', { responseType: 'arrayBuffer' });
  });

  it('should resolve local fonts using readFile', async () => {
    const mockBuffer = Buffer.from('font-data');
    vi.mocked(readFile).mockResolvedValue(mockBuffer);

    const result = await resolver.resolve('./font.ttf');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(readFile).toHaveBeenCalledWith('./font.ttf');
  });

  it('should throw FontaineNetworkError on fetch failure', async () => {
    vi.mocked(ofetch).mockRejectedValue({ response: { status: 404 }, message: 'Not Found' });
    await expect(resolver.resolve('https://example.com/404.ttf')).rejects.toThrow(FontaineNetworkError);
  });

  it('should throw FontaineFileSystemError on read failure', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'));
    await expect(resolver.resolve('./missing.ttf')).rejects.toThrow(FontaineFileSystemError);
  });
});
