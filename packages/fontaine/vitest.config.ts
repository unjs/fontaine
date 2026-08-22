import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      fontaine: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  test: {
    sequence: {
      shuffle: {
        files: true,
        tests: true,
      },
    },
    coverage: {
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
      include: ['src'],
      reporter: ['text', 'json', 'html'],
    },
  },
}) as any
