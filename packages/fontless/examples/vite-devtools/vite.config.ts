import { fontless } from 'fontless'
import { defineConfig } from 'vite'

export default defineConfig({
  devtools: true,
  plugins: [
    fontless({
      families: [
        { name: 'Fira Code', provider: 'google', weights: [400, 700] },
      ],
    }),
  ],
})
