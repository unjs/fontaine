import react from '@vitejs/plugin-react-swc'
import { fontless } from 'fontless'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fontless()],
})
