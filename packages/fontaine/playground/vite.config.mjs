import { FontaineTransform } from 'fontaine'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    FontaineTransform.vite({
      fallbacks: ['Arial'],
      // resolve absolute URL -> file
      resolvePath: id => new URL(`.${id}`, import.meta.url),
    }),
  ],
})
