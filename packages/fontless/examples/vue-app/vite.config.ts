import vue from '@vitejs/plugin-vue'
import { fontless } from 'fontless'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), fontless()],
})
