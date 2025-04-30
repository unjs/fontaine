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
        100: true,
      },
      include: ['src'],
      reporter: ['text', 'json', 'html'],
    },
  },
})
