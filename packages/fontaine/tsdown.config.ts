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
  // Ensure the shebang is preserved for the cli entry
  banner: {
    js: (entry) => entry === 'cli' ? '#!/usr/bin/env node\n' : '',
  },
});
