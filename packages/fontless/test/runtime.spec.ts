import type { InlineConfig, Plugin } from 'vite'
import type { FontlessOptions } from '../src/types'
import { promises as fsp } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join } from 'pathe'
import { build, createServer } from 'vite'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { fontless } from '../src'

const root = fileURLToPath(new URL('../examples/vanilla-app', import.meta.url))
const outDirs: string[] = []

afterAll(async () => {
  await Promise.all(outDirs.map(dir => fsp.rm(dir, { recursive: true, force: true })))
})

const ENTRY_ID = 'virtual:fontless-runtime-fixture'

function entryPlugin(): Plugin {
  return {
    name: 'test-runtime-entry',
    resolveId(source) {
      if (source === ENTRY_ID) {
        return `\0${ENTRY_ID}`
      }
    },
    load(id) {
      if (id === `\0${ENTRY_ID}`) {
        return `import './src/style.css'\nimport { preloads } from 'fontless/runtime'\nexport { preloads }`
      }
    },
  }
}

function extractHrefs(chunk: string) {
  return [...chunk.matchAll(/href:["'`]([^"'`]+\.woff2)/g)].map(([, href]) => href!)
}

const options: FontlessOptions = { families: [{ name: 'Poppins', preload: true }] }

describe('`fontless/runtime` in build', () => {
  async function buildApp(config: Omit<InlineConfig, 'root' | 'configFile' | 'logLevel'> = {}) {
    const outDir = await fsp.mkdtemp(join(tmpdir(), 'fontless-runtime-'))
    outDirs.push(outDir)

    await build({
      ...config,
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [entryPlugin(), fontless(options)],
      build: {
        ...config.build,
        outDir,
        emptyOutDir: true,
        rollupOptions: { input: { entry: ENTRY_ID } },
      },
    })

    const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outDir }))
    const chunk = await fsp.readFile(join(outDir, files.find(file => file.endsWith('.js'))!), 'utf-8')
    return { files, chunk, hrefs: extractHrefs(chunk) }
  }

  it('should render preload links pointing at emitted fonts', { timeout: 20_000 }, async () => {
    const { chunk, files, hrefs } = await buildApp()

    expect(chunk).not.toContain('__FONTLESS_RUNTIME_BUILD_PLACEHOLDER__')
    expect(chunk).not.toContain('__VITE_ASSET__')
    expect(chunk).toMatch(/rel:["'`]preload/)
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(files).toContain(join('assets/_fonts', href.split('/_fonts/')[1]!))
    }
  })

  it('should keep preload links resolvable when fonts are served from a custom prefix', { timeout: 20_000 }, async () => {
    const outDir = await fsp.mkdtemp(join(tmpdir(), 'fontless-runtime-'))
    outDirs.push(outDir)

    await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [entryPlugin(), fontless({ ...options, assets: { prefix: '/fonts' } })],
      build: { outDir, emptyOutDir: true, rollupOptions: { input: { entry: ENTRY_ID } } },
    })

    const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outDir }))
    const chunk = await fsp.readFile(join(outDir, files.find(file => file.endsWith('.js'))!), 'utf-8')
    const hrefs = extractHrefs(chunk)

    expect(hrefs.length).toBeGreaterThan(0)
    expect(hrefs.every(href => href.startsWith('/fonts/'))).toBe(true)
    for (const href of hrefs) {
      expect(files).toContain(href.slice(1))
    }
  })
})

describe('`fontless/runtime` in dev', () => {
  it('should reflect fonts as stylesheets are transformed', { timeout: 20_000 }, async () => {
    const server = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      server: { middlewareMode: true },
      plugins: [entryPlugin(), fontless(options)],
    })

    try {
      const before = await server.ssrLoadModule('fontless/runtime')
      expect(before.preloads).toEqual([])

      await server.transformRequest('/src/style.css')

      const after = await server.ssrLoadModule('fontless/runtime')
      expect(after.preloads.length).toBeGreaterThan(0)
      expect(after.preloads[0]).toMatchObject({ rel: 'preload', as: 'font', crossorigin: '' })
      expect(after.preloads[0].href).toMatch(/\/assets\/_fonts\/.*\.woff2$/)
    }
    finally {
      await server.close()
    }
  })
})

describe('published `fontless/runtime` stub', () => {
  it('should warn that no fonts will be preloaded', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const { preloads } = await import('../src/runtime')
      expect(preloads).toEqual([])
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('was not transformed by the fontless Vite plugin'))
    }
    finally {
      warn.mockRestore()
    }
  })
})
