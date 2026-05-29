import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm'],
  minify: false,
  // Post-build hook to ensure binary executable permissions
  onBuildComplete: async () => {
    const { execSync } = await import('node:child_process');
    execSync('chmod +x dist/cli.js');
  },
});
