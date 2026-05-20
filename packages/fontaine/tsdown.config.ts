import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    cli: './src/cli.ts',
  },
  format: ['esm'],
  outDir: './dist',
  bundle: true,
  minify: false,
  // Ensure CLI file maintains executable bits and shebang
  hooks: {
    'build:done': async () => {
      // Logic for post-build permission settings handled by deployment/npm bin
    }
  }
});
