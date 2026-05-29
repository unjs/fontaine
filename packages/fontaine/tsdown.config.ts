import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    index: 'src/index.ts',
  },
  format: ['esm'],
  minify: false,
  banner: '#!/usr/bin/env node\n',
});
