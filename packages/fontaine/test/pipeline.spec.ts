import { describe, it, expect, vi } from 'vitest';
import { runPipeline } from '../src/index.js';
import { FetchError } from '../src/errors.js';
import { Resolver } from '../src/resolver.js';

vi.mock('ofetch');
import { ofetch } from 'ofetch';

describe('Pipeline Edge Cases', () => {
  it('should throw FetchError on invalid content-type', async () => {
    vi.mocked(ofetch).mockResolvedValue({
      headers: { get: () => 'text/plain' },
      _data: new ArrayBuffer(8),
    } as any);

    await expect(runPipeline('https://example.com/font.ttf'))
      .rejects.toThrow(FetchError);
  });

  it('should fail fast on non-existent local files', async () => {
    await expect(runPipeline('/non/existent/path.ttf'))
      .rejects.toThrow(FetchError);
  });

  it('should handle network timeouts via ofetch rejection', async () => {
    vi.mocked(ofetch).mockRejectedValue(new Error('Timeout'));
    await expect(runPipeline('https://example.com/font.ttf'))
      .rejects.toThrow(FetchError);
  });
});
