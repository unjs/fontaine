import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/cli.ts'],
  format: ['esm'],
  outDir: 'dist',
  banner: '#!/usr/bin/env node',
  minify: true,
  splitting: false,
});
