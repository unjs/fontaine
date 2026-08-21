import { promises as fsp } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'pathe'
import { build, createBuilder } from 'vite'
import { describe, expect, it } from 'vitest'

const RSC_FIXTURE = 'rsc-app'

const fixtures = await Array.fromAsync(fsp.glob('*', {
  cwd: fileURLToPath(new URL('../examples', import.meta.url)),
})).then(fixtures => fixtures.filter(fixture =>
  // Qwik does not support Vite 8 / Rolldown yet: its bundler integration needs
  // internal changes. Until that lands, its path-like chunk names are rejected
  // by Vite 8. See: https://github.com/QwikDev/qwik/pull/8785
  fixture !== 'qwik-app' && fixture !== RSC_FIXTURE,
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
      const html = files.find(file => file.endsWith('.html'))!
      const htmlContent = await readFile(join(outputDir!, html), 'utf-8')
      expect(htmlContent).toContain('rel="preload" as="font"')
      expect(htmlContent).toContain('.woff2"')
    }

    const font = files.find(file => file.endsWith('.woff2'))
    expect(font).toBeDefined()
  })
})

describe(`e2e ${RSC_FIXTURE}`, () => {
  it('should emit each font only into the environment whose CSS references it', { timeout: 60_000 }, async () => {
    const root = fileURLToPath(new URL(`../examples/${RSC_FIXTURE}`, import.meta.url))
    const cwd = process.cwd()
    process.chdir(root)
    const builder = await createBuilder({ root })
    await builder.buildApp().finally(() => process.chdir(cwd))

    const outputDir = resolve(root, 'dist')
    const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outputDir }))

    const environments = ['client', 'ssr', 'rsc']
    const emitted: Record<string, Set<string>> = {}
    const referenced: Record<string, Set<string>> = {}

    for (const environment of environments) {
      const envFiles = files.filter(file => file.startsWith(`${environment}/`))
      emitted[environment] = new Set(envFiles.filter(file => file.endsWith('.woff2')).map(file => file.slice(`${environment}/`.length)))
      referenced[environment] = new Set()
      for (const css of envFiles.filter(file => file.endsWith('.css'))) {
        const content = await readFile(join(outputDir, css), 'utf-8')
        expect(content).toMatch(/url\((?:\.\.\/)*\/?assets\/_fonts/)
        for (const [, font] of content.matchAll(/url\((?:\.\.\/)*\/?(assets\/_fonts\/[^)"']+\.woff2)/g)) {
          referenced[environment]!.add(font!)
        }
      }
    }

    expect(emitted.rsc!.size).toBeGreaterThan(0)
    expect(emitted.client!.size).toBeGreaterThan(0)

    // Fonts used to be emitted into every environment's bundle, because the plugin's
    // rendered font state is shared across environments. See
    // https://github.com/unjs/fontaine/pull/653
    for (const environment of environments) {
      expect([...emitted[environment]!].sort(), `unexpected fonts in ${environment} bundle`)
        .toEqual([...referenced[environment]!].sort())
    }

    const clientOnly = [...emitted.client!].filter(font => !referenced.rsc!.has(font))
    expect(clientOnly.length, 'expected client-only fonts to exercise cross-environment leakage').toBeGreaterThan(0)
    for (const font of clientOnly) {
      expect(emitted.rsc, `${font} leaked into the rsc bundle`).not.toContain(font)
    }

    for (const file of files.filter(file => file.endsWith('.woff2'))) {
      const { size } = await fsp.stat(join(outputDir, file))
      expect(size, `${file} was emitted as an empty placeholder`).toBeGreaterThan(0)
    }
  })
})
