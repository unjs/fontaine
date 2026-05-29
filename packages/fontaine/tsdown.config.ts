import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm'],
  outDir: 'dist',
  minify: true,
  // Ensure the CLI file maintains the shebang
  banner: {
    cli: '#!/usr/bin/env node\n',
  },
});
