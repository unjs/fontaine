import react from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import { fontless } from 'fontless'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    rsc(),
    fontless(),
  ],
  environments: {
    rsc: {
      build: {
        rollupOptions: {
          input: { index: './src/entry.rsc.tsx' },
        },
      },
    },
    ssr: {
      build: {
        rollupOptions: {
          input: { index: './src/entry.ssr.tsx' },
        },
      },
    },
    client: {
      build: {
        rollupOptions: {
          input: { index: './src/entry.browser.tsx' },
        },
      },
    },
  },
})
