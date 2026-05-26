import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

describe('CLI Binary Distribution', () => {
  it('executes compiled binary and returns valid JSON', () => {
    const binaryPath = join(process.cwd(), 'dist/cli.mjs');
    
    // Test with a local file from the playground
    const fontPath = join(process.cwd(), 'playground/fonts/font.ttf');
    const output = execSync(`node \${binaryPath} \${fontPath} --format=json`).toString();
    
    expect(() => JSON.parse(output)).not.toThrow();
    const json = JSON.parse(output);
    expect(json).toHaveProperty('fontName');
  });
});
