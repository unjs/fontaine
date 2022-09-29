import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      fontaine: fileURLToPath(new URL('./src/index.ts', import.meta.url).href),
    },
  },
  test: {
    coverage: {
      include: ['src'],
      reporter: ['text', 'json', 'html'],
    },
  },
})
