import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      fontaine: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  test: {
    coverage: {
      thresholds: {
        branches: 93.04,
        functions: 100,
        lines: 98.1,
        statements: 98.15,
      },
      include: ['src'],
      reporter: ['text', 'json', 'html'],
    },
  },
}) as any
