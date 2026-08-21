import { sveltekit } from '@sveltejs/kit/vite'
import { fontless } from 'fontless'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    sveltekit(),
    fontless({
      defaults: {
        preload: true,
      },
    }),
  ],
})
