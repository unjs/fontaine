import type { Provider, ProviderContext } from 'unifont'
import type { InlineConfig, Plugin } from 'vite'
import type { FontlessOptions } from '../src/types'
import { promises as fsp } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { build, createServer } from 'vite'
import { afterAll, describe, expect, it } from 'vitest'
import { fontless } from '../src'

const scratchDirs: string[] = []

afterAll(async () => {
  await Promise.all(scratchDirs.map(dir => fsp.rm(dir, { recursive: true, force: true })))
})

/**
 * Resolves every family to a single font at `url`, so no network is needed, and records the
 * options the plugin passed to the provider factory.
 */
function createStubProvider(url = '/inter.woff2', name = 'stub') {
  const receivedOptions: unknown[] = []
  const provider = (providerOptions: unknown) => {
    receivedOptions.push(providerOptions)
    return Object.assign(
      (_ctx: ProviderContext) => ({
        resolveFont: () => ({ fonts: [{ src: [{ url, format: 'woff2' }], weight: 400 }] }),
      }),
      { _name: name, _options: {} },
    ) as unknown as Provider
  }
  return { provider: provider as never, receivedOptions }
}

async function createFixture(files: Record<string, string>) {
  const root = await fsp.mkdtemp(join(tmpdir(), 'fontless-vite-'))
  scratchDirs.push(root)
  await Promise.all(Object.entries(files).map(([file, content]) => fsp.writeFile(join(root, file), content)))
  await fsp.writeFile(join(root, 'inter.woff2'), 'not-really-a-font')
  return root
}

const html = '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body></body></html>'
const styles = `body { font-family: 'Inter' }`

function withStub(options: FontlessOptions = {}): FontlessOptions {
  return { provider: 'stub', providers: { stub: createStubProvider().provider }, ...options }
}

async function buildApp(root: string, options: FontlessOptions = {}, config: InlineConfig = {}) {
  const outDir = await fsp.mkdtemp(join(tmpdir(), 'fontless-vite-out-'))
  scratchDirs.push(outDir)

  await build({
    ...config,
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [fontless(withStub(options))],
    build: { ...config.build, outDir, emptyOutDir: true },
  })

  const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outDir }))
  const cssFile = files.find(file => file.endsWith('.css'))

  return { files, css: cssFile ? await fsp.readFile(join(outDir, cssFile), 'utf-8') : '' }
}

describe('fontless vite plugin', () => {
  it('should tolerate `resolve.alias` given as an array', async () => {
    const root = await createFixture({ 'index.html': html, 'style.css': styles })
    const { css } = await buildApp(root, {}, { resolve: { alias: [{ find: '@', replacement: root }] } })

    expect(css).toContain('@font-face')
  })

  it('should not inject `@font-face` for families declared `global`', async () => {
    const root = await createFixture({ 'index.html': html, 'style.css': styles })
    const { css } = await buildApp(root, { families: [{ name: 'Inter', global: true }] })

    expect(css).not.toContain('@font-face')
  })

  it('should minify generated declarations with lightningcss when configured', async () => {
    const root = await createFixture({ 'index.html': html, 'style.css': styles })
    const { css } = await buildApp(root, {}, { css: { transformer: 'lightningcss', lightningcss: {} } })

    expect(css).toContain('@font-face{')
  })

  it('should resolve families declared in CSS variables when asked', async () => {
    const root = await createFixture({ 'index.html': html, 'style.css': `:root { --heading: 'Inter' }` })
    const { css } = await buildApp(root, { processCSSVariables: true })

    expect(css).toContain('@font-face')
  })

  it('should leave stylesheets without a resolvable family untouched', async () => {
    const root = await createFixture({ 'index.html': html, 'style.css': `body { font-family: sans-serif }` })
    const { css } = await buildApp(root)

    expect(css).not.toContain('@font-face')
  })

  it('should give the npm provider a `readFile` that resolves to null for missing files', async () => {
    const root = await createFixture({ 'index.html': html, 'style.css': styles })
    const { provider, receivedOptions } = createStubProvider('/inter.woff2', 'npm')

    await buildApp(root, { provider: 'npm', providers: { npm: provider } })

    const npmOptions = receivedOptions[0] as { root: string, readFile: (path: string) => Promise<string | null> }
    expect(npmOptions.root).toBe(root)
    expect(await npmOptions.readFile(join(root, 'style.css'))).toContain('font-family')
    expect(await npmOptions.readFile(join(root, 'missing.css'))).toBeNull()
  })

  it('should forward font loading failures to the dev server error handler', async () => {
    const root = await createFixture({ 'index.html': html, 'style.css': styles })
    const { provider } = createStubProvider('https://127.0.0.1:1/inter.woff2')
    const server = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0 },
      plugins: [fontless(withStub({ providers: { stub: provider } }))],
    })

    try {
      await server.listen()
      const transformed = await server.transformRequest('/style.css')
      const file = transformed!.code.match(/\/assets\/_fonts\/([\w-]+\.woff2)/)![1]

      const response = await fetch(new URL(`/assets/_fonts/${file}`, server.resolvedUrls!.local[0]))

      expect(response.status).toBe(500)
    }
    finally {
      await server.close()
    }
  })

  it('should skip stylesheets with no `font-family` when CSS variables are not processed', async () => {
    const root = await createFixture({ 'index.html': html, 'style.css': `:root { --heading: 'Inter' }` })
    const { css } = await buildApp(root, { processCSSVariables: false })

    expect(css).not.toContain('@font-face')
  })

  it('should preload fonts that were not rewritten into emitted assets', async () => {
    const root = await createFixture({ 'index.html': html, 'style.css': styles })
    const entry: Plugin = {
      name: 'test-runtime-entry',
      resolveId: source => source === 'virtual:entry' ? '\0virtual:entry' : undefined,
      load: id => id === '\0virtual:entry'
        ? `import '/style.css'\nimport { preloads } from 'fontless/runtime'\nexport { preloads }`
        : undefined,
    }

    const outDir = await fsp.mkdtemp(join(tmpdir(), 'fontless-vite-out-'))
    scratchDirs.push(outDir)

    await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [fontless(withStub({ families: [{ name: 'Inter', preload: true }] })), entry],
      build: { outDir, emptyOutDir: true, rollupOptions: { input: { entry: 'virtual:entry' } } },
    })

    const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outDir }))
    const chunk = await fsp.readFile(join(outDir, files.find(file => file.endsWith('.js'))!), 'utf-8')

    expect(chunk).toContain('/inter.woff2')
  })
})
