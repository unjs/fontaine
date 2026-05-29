import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm'],
  outDir: 'dist',
  bundle: true,
  minify: false,
  // Ensure shebang is preserved for the cli entry
  banner: {
    cli: '#!/usr/bin/env node\n',
  },
});
