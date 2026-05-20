import { describe, it, expect } from 'vitest';
import { AnalysisPipeline } from '../src/pipeline';
import { ResolverError } from '../src/errors';
import { execa } from 'execa';

describe('AnalysisPipeline', () => {
  const pipeline = new AnalysisPipeline();

  it('should process a valid font source', async () => {
    // Using a known valid font endpoint for the test
    const result = await pipeline.run('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92tCVqlddLlnw.ttf');
    expect(result).toContain('--font-ascent');
  });

  it('should throw ResolverError for invalid file signatures', async () => {
    await expect(pipeline.run('https://google.com')).rejects.toThrow(ResolverError);
  });
});

describe('CLI Binary', () => {
  it('should output CSS by default', async () => {
    const { stdout } = await execa('node', ['../src/cli.ts', 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92tCVqlddLlnw.ttf']);
    expect(stdout).toContain('.fontaine-metrics');
  });

  it('should return exit code 1 for missing arguments', async () => {
    try {
      await execa('node', ['../src/cli.ts']);
    } catch (error: any) {
      expect(error.exitCode).toBe(1);
    }
  });
});
