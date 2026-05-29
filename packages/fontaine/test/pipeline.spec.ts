import { describe, it, expect } from 'vitest';
import { runAnalysisPipeline } from '../src/pipeline';
import { FontaineFetchError, FontaineValidationError } from '../src/errors';

describe('Analysis Pipeline Integration', () => {
  it('should throw FontaineFetchError for 404 responses', async () => {
    await expect(runAnalysisPipeline({ source: 'https://example.com/nonexistent.ttf' }))
      .rejects.toThrow(FontaineFetchError);
  });

  it('should throw FontaineValidationError for invalid font buffers', async () => {
    await expect(runAnalysisPipeline({ source: 'packages/fontaine/package.json' }))
      .rejects.toThrow(FontaineValidationError);
  });
});
