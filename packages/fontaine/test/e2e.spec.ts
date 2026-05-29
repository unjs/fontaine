import { describe, it, expect } from 'vitest';
import { execa } from 'execa';
import path from 'node:path';

describe('Fontaine CLI E2E', () => {
  const CLI_PATH = path.resolve(__dirname, '../dist/cli.js');

  it('should exit with error code 1 on invalid URL', async () => {
    try {
      await execa('node', [CLI_PATH, 'https://invalid-url-that-does-not-exist.com/font.woff2']);
    } catch (error: any) {
      expect(error.exitCode).toBe(1);
      expect(error.stderr).toContain('FETCH_ERROR');
    }
  });

  it('should reject non-font binaries', async () => {
    // Using a known non-font asset (the package.json) as a dummy binary
    const dummyFile = path.resolve(__dirname, '../package.json');
    try {
      await execa('node', [CLI_PATH, dummyFile]);
    } catch (error: any) {
      expect(error.exitCode).toBe(1);
      expect(error.stderr).toContain('VALIDATION_ERROR');
    }
  });

  it('should output valid JSON when requested', async () => {
    const fontPath = path.resolve(__dirname, '../playground/fonts/font.ttf');
    const { stdout } = await execa('node', [CLI_PATH, fontPath, '--format', 'json']);
    expect(() => JSON.parse(stdout)).not.toThrow();
  });
});
