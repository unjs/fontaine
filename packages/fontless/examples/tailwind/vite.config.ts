import { fontless } from 'fontless'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    // any plugins order should work
    tailwindcss(),
    fontless({
      provider: 'google',
      families: [
        {
          name: 'Geist',
          preload: ['latin'],
        }
      ]
    }),
  ],
})
