import { describe, it, expect } from 'vitest';
import { fontaine } from '../src/index.js';
import { FontaineInvalidContentTypeError } from '../src/errors.js';

describe('Fontaine Pipeline Matrix', () => {
  it('should resolve local file to CSS output', async () => {
    const result = await fontaine('./playground/fonts/font.ttf', { format: 'css' });
    expect(result).toContain('size-adjust');
  });

  it('should resolve remote URL to JSON output', async () => {
    const result = await fontaine('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_R8Cg.ttf', { format: 'json' });
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should throw FontaineInvalidContentTypeError for non-font URLs', async () => {
    await expect(fontaine('https://google.com')).rejects.toThrow(FontaineInvalidContentTypeError);
  });
});
