import { describe, it, expect, vi } from 'vitest';
import { runFontainePipeline } from '../src/pipeline';
import { FontaineFetchError, FontaineInvalidContentTypeError } from '../src/errors';

describe('Fontaine Pipeline', () => {
  it('should throw FontaineInvalidContentTypeError for non-font URLs', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      headers: { get: () => 'text/plain' }
    });
    
    await expect(runFontainePipeline('https://example.com/test.txt', { fetch: mockFetch }))
      .rejects.toThrow(FontaineInvalidContentTypeError);
  });

  it('should throw FontaineFetchError for 404 responses', async () => {
    const mockFetch = vi.fn().mockRejectedValue({
      response: { status: 404 },
      message: 'Not Found'
    });

    await expect(runFontainePipeline('https://example.com/404.ttf', { fetch: mockFetch }))
      .rejects.toThrow(FontaineFetchError);
  });
});
