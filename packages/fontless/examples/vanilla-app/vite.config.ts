import { fontless } from 'fontless'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    fontless({
      families: [
        { name: 'Poppins', preload: true, },
      ],
    }),
  ],
})
