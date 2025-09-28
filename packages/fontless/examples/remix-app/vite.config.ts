import { reactRouter } from '@react-router/dev/vite'
import { fontless } from 'fontless'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    fontless(),
  ],
})
