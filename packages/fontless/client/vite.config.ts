import type { Server } from 'node:http'
import type { Plugin } from 'vite'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import { createFontlessDevframe } from '../src/devtools'
import { createFixtures } from './fixtures'

const devframe = createFontlessDevframe()
const base = `/__${devframe.definition.id}/`

/**
 * Serve the devframe's RPC backend from the Vite dev server, under the same base the SPA is
 * mounted at by devframe hosts, with fixture fonts exposed.
 */
function devBridge(): Plugin {
  return {
    name: 'fontless:devtools-client-bridge',
    apply: 'serve',
    async configureServer(server) {
      const { initDevframe } = await import('devframe/initiate')
      for (const font of createFixtures(base)) {
        devframe.exposeFont(font)
      }
      const instance = initDevframe(devframe.definition, {
        base,
        distDir: false,
        server: server.httpServer as Server,
        auth: false,
      })
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith(`${base}__`)) {
          instance.nodeMiddleware(req, res, next)
        }
        else {
          next()
        }
      })
    },
  }
}

/**
 * microlighter loads its TextMate grammars with `import(`./grammars/${lang}.js`)`, which is left
 * unresolved inside `node_modules`. Only the CSS grammar is needed here.
 */
function microlighterGrammars(): Plugin {
  return {
    name: 'fontless:microlighter-grammars',
    enforce: 'pre',
    transform: {
      filter: { id: /microlighter[\\/]dist[\\/]grammar-dependencies\.js$/ },
      handler(code) {
        return code.replace(
          /import\(`\.\/grammars\/\$\{language\}\.js`\)/,
          '(language === \'css\' ? import(\'./grammars/css.js\') : Promise.reject(new Error(language)))',
        )
      },
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? base : './',
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue(), UnoCSS(fileURLToPath(new URL('./uno.config.ts', import.meta.url))), microlighterGrammars(), devBridge()],
  optimizeDeps: {
    exclude: ['microlighter'],
  },
  build: {
    outDir: fileURLToPath(new URL('../dist/devtools-client', import.meta.url)),
    emptyOutDir: true,
  },
}))
