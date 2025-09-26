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
          if (content.includes('url(/_fonts')) {
            found = true
            break
          }
        }
      }
      expect(found).toBe(true)
    }
    else {
      const css = files.find(file => file.endsWith('.css'))!
      expect(await readFile(join(outputDir!, css), 'utf-8')).toContain('url(/_fonts')
      if (fixture === 'vanilla-app') {
        const html = files.find(file => file.endsWith('.html'))!
        expect(await readFile(join(outputDir!, html), 'utf-8')).toContain('rel="preload"')
      }
    }

    const font = files.find(file => file.endsWith('.woff2'))
    expect(font).toBeDefined()
  })
})
