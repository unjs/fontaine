import { describe, it, expect, vi } from 'vitest';
import { analyzeFontUrl } from '../src/url-analyzer';
import { FontaineError } from '../src/errors';
import ofetch from 'ofetch';

vi.mock('ofetch');

describe('Fontaine Integration - Remote Edge Cases', () => {
  it('throws FontaineError on 404 Not Found', async () => {
    (ofetch as any).mockRejectedValueOnce({ response: { status: 404 } });
    await expect(analyzeFontUrl('https://cdn.com/missing.ttf')).rejects.toThrow(FontaineError);
  });

  it('throws FontaineError on invalid Content-Type', async () => {
    (ofetch as any).mockResolvedValueOnce({
      headers: { get: () => 'text/plain' },
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    await expect(analyzeFontUrl('https://cdn.com/text.txt')).rejects.toThrow('Invalid content-type');
  });

  it('handles timeout failures gracefully', async () => {
    (ofetch as any).mockRejectedValueOnce(new Error('Network timeout'));
    await expect(analyzeFontUrl('https://cdn.com/timeout.ttf')).rejects.toThrow(/Remote font fetch failed/);
  });
});
