import { join } from 'pathe'
import { defineConfig } from 'vite'
import { FontaineTransform } from '../src'

export default defineConfig({
  root: '../playground',
  plugins: [
    FontaineTransform.vite({
      fallbacks: ['Arial', 'Segoe UI'],
      // resolve absolute URL -> file
      resolvePath: id =>
        new URL(join('../playground', '.' + id), import.meta.url),
    }),
  ],
})
