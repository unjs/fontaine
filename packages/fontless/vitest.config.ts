import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      fontless: fileURLToPath(
        new URL('./src/index.ts', import.meta.url).href,
      ),
    },
  },
  test: {
    sequence: {
      shuffle: {
        files: true,
        tests: true,
      },
    },
    dir: 'test',
    coverage: {
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
      include: ['src/**/*.ts'],
      reporter: ['text', 'json', 'html'],
    },
  },
}) as any
