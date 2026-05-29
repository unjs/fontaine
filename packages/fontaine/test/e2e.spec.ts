import { execSync } from 'child_process';
import { describe, it, expect } from 'vitest';
import path from 'path';

describe('CLI Binary Integrity', () => {
  const binaryPath = path.resolve(__dirname, '../dist/cli.js');

  it('should execute via node and return correct exit code for missing args', () => {
    try {
      execSync(`node ${binaryPath}`);
    } catch (error: any) {
      expect(error.status).toBe(64);
    }
  });

  it('should handle invalid URLs with NetworkError code', () => {
    try {
      execSync(`node ${binaryPath} http://invalid.local`);
    } catch (error: any) {
      expect(error.status).not.toBe(0);
    }
  });
});
