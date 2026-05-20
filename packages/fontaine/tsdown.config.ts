import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    cli: './src/cli.ts',
    index: './src/index.ts',
  },
  format: ['esm'],
  minify: false,
  bundle: true,
  // tsdown handles shebang injection when output is configured for bin
});
