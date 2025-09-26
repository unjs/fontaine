import { fontless } from 'fontless'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    fontless({
      families: [
        { name: 'Press Start 2P', preload: true, },
      ],
    }),
  ],
})
