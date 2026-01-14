import type { RollupOutput } from 'rollup'
import { promises as fsp } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'pathe'
import { build } from 'vite'
import { describe, expect, it } from 'vitest'

const fixtures = await Array.fromAsync(fsp.glob('*', {
  cwd: fileURLToPath(new URL('../examples', import.meta.url)),
}))

describe.each(fixtures)('e2e %s', (fixture) => {
  it('should compile', { timeout: 20_000 }, async () => {
    const root = fileURLToPath(new URL(`../examples/${fixture}`, import.meta.url))
    let outputDir: string
    await build({
      root,
      plugins: [
        {
          name: 'spy',
          configResolved(config) {
            outputDir = resolve(root, config.build.outDir)
          },
        },
      ],
    }) as RollupOutput

    const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outputDir! }))

    if (fixture === 'qwik-app') {
      let found = false
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = await readFile(join(outputDir!, file), 'utf-8')
          if (content.includes('url(/assets/_fonts')) {
            found = true
            break
          }
        }
      }
      expect(found).toBe(true)
    }
    else {
      const css = files.find(file => file.endsWith('.css'))!
      const content = await readFile(join(outputDir!, css), 'utf-8')
      expect(content).toContain('url(/assets/_fonts')
      if (fixture === 'vanilla-app') {
        expect(content).toContain('--font-test-variable: "Press Start 2P", "Press Start 2P Fallback: BlinkMacSystemFont", "Press Start 2P Fallback: Segoe UI", "Press Start 2P Fallback: Helvetica Neue", "Press Start 2P Fallback: Arial", "Press Start 2P Fallback: Noto Sans", sans-serif')
        const html = files.find(file => file.endsWith('.html'))!
        expect(await readFile(join(outputDir!, html), 'utf-8')).toContain('rel="preload"')
      }
      if (fixture === 'tailwind') {
        expect(content).toContain('--font-sans:"Geist", "Geist Fallback: BlinkMacSystemFont", "Geist Fallback: Segoe UI", "Geist Fallback: Helvetica Neue", "Geist Fallback: Arial", "Geist Fallback: Noto Sans",sans-serif')
        expect(content).toContain('format(woff2)')
      }
    }

    const font = files.find(file => file.endsWith('.woff2'))
    expect(font).toBeDefined()
  })
})
