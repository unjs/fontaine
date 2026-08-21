import { promises as fsp } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'pathe'
import { build } from 'vite'
import { describe, expect, it } from 'vitest'

const fixtures = await Array.fromAsync(fsp.glob('*', {
  cwd: fileURLToPath(new URL('../examples', import.meta.url)),
})).then(fixtures => fixtures.filter(fixture =>
  // Qwik does not support Vite 8 / Rolldown yet: its bundler integration needs
  // internal changes. Until that lands, its path-like chunk names are rejected
  // by Vite 8. See: https://github.com/QwikDev/qwik/pull/8785
  fixture !== 'qwik-app',
))

describe.each(fixtures)('e2e %s', (fixture) => {
  it('should compile', { timeout: 20_000 }, async () => {
    const root = fileURLToPath(new URL(`../examples/${fixture}`, import.meta.url))
    let outputDir: string
    const cwd = process.cwd()
    process.chdir(root)
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
    }).finally(() => process.chdir(cwd))

    const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outputDir! }))

    const css = files.find(file => file.endsWith('.css'))
    expect(css, `no CSS file emitted for ${fixture}`).toBeDefined()
    const content = await readFile(join(outputDir!, css!), 'utf-8')
    expect(content).toMatch(/url\((?:\.\.\/)*\/?assets\/_fonts/)
    if (fixture === 'vanilla-app') {
      expect(content).toMatch(/--font-test-variable:\s*"Press Start 2P", "Press Start 2P Fallback: BlinkMacSystemFont", "Press Start 2P Fallback: Segoe UI", "Press Start 2P Fallback: Helvetica Neue", "Press Start 2P Fallback: Arial", "Press Start 2P Fallback: Noto Sans", sans-serif/)
      const html = files.find(file => file.endsWith('.html'))!
      expect(await readFile(join(outputDir!, html), 'utf-8')).toContain('rel="preload"')
    }
    if (fixture === 'tailwind') {
      expect(content).toMatch(/--font-sans:\s*"Geist", "Geist Fallback: BlinkMacSystemFont", "Geist Fallback: Segoe UI", "Geist Fallback: Helvetica Neue", "Geist Fallback: Arial", "Geist Fallback: Noto Sans",\s*sans-serif/)
      expect(content).toContain('format("woff2")')
    }

    const font = files.find(file => file.endsWith('.woff2'))
    expect(font).toBeDefined()
  })
})
