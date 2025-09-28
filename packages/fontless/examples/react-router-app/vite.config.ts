import { reactRouter } from '@react-router/dev/vite'
import { fontless } from 'fontless'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    reactRouter(),
    fontless(),
  ],
})
