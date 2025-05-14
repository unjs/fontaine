import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fontless } from 'fontless'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), fontless()],
})
