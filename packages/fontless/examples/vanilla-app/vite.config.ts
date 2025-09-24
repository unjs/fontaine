import { fontless } from 'fontless'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [fontless({
    providers: {
      // google: true,          // Google Fonts
      bunny: false,           // Bunny Fonts
      fontshare: false,       // FontShare
      fontsource: false,      // FontSource
      adobe: false
    },
    assets: { prefix: '/_fonts' },
  })],
})
