import type { InlineConfig } from 'vite'
import type { FontlessOptions } from '../src/types'
import { promises as fsp } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer as createHTTPServer } from 'node:http'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join } from 'pathe'
import { build, createServer } from 'vite'
import { afterAll, expect, it } from 'vitest'
import { fontless } from '../src'

const root = fileURLToPath(new URL('../examples/vanilla-app', import.meta.url))
const outDirs: string[] = []

afterAll(async () => {
  await Promise.all(outDirs.map(dir => fsp.rm(dir, { recursive: true, force: true })))
})

async function buildApp({ plugins = [], ...config }: Omit<InlineConfig, 'root' | 'configFile' | 'logLevel'>, fontlessOptions: FontlessOptions = { families: [{ name: 'Poppins', preload: true }] }) {
  const outDir = await fsp.mkdtemp(join(tmpdir(), 'fontless-base-'))
  outDirs.push(outDir)

  await build({
    ...config,
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [fontless(fontlessOptions), plugins],
    build: { ...config.build, outDir, emptyOutDir: true },
  })

  const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outDir }))
  const read = (file: string) => readFile(join(outDir, file), 'utf-8')

  return {
    outDir,
    files,
    fonts: files.filter(file => file.startsWith('assets/_fonts/')),
    css: await read(files.find(file => file.endsWith('.css'))!),
    html: await read(files.find(file => file.endsWith('.html'))!),
  }
}

it.each(['./', ''])('should emit font URLs relative to the CSS chunk for base %s', { timeout: 20_000 }, async (base) => {
  const { outDir, css, fonts } = await buildApp({ base })

  const urls = [...css.matchAll(/url\((\.[^)]+\.woff2)\)/g)].map(([, url]) => url!)
  expect(urls.length).toBeGreaterThan(0)

  for (const url of urls) {
    expect(fonts).toContain(join('assets', url))
    expect((await fsp.stat(join(outDir, 'assets', url))).size).toBeGreaterThan(0)
  }
})

it('should reuse fonts referenced from more than one stylesheet', { timeout: 20_000 }, async () => {
  const extraCSS = '.extra { font-family: "Poppins", sans-serif; }'
  const { outDir, css, fonts } = await buildApp({
    plugins: [{
      name: 'extra-css',
      resolveId: id => id === 'virtual:extra.css' ? '\0virtual:extra.css' : undefined,
      load: id => id === '\0virtual:extra.css' ? extraCSS : undefined,
      transform: (code, id) => id.endsWith('main.ts') ? `import 'virtual:extra.css'\n${code}` : undefined,
    }],
  })

  expect(css).toContain('.extra{')

  const urls = new Set([...css.matchAll(/url\((\/assets\/_fonts\/[^)]+\.woff2)\)/g)].map(([, url]) => url!.slice(1)))
  expect(urls.size).toBeGreaterThan(0)
  expect(fonts).toEqual(expect.arrayContaining([...urls]))

  for (const file of urls) {
    expect((await fsp.stat(join(outDir, file))).size).toBeGreaterThan(0)
  }
})

it('should apply experimental.renderBuiltUrl to font URLs', { timeout: 20_000 }, async () => {
  const { css, html } = await buildApp({
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        return filename.includes('_fonts') ? `https://cdn.example.com/${filename}` : { relative: hostType !== 'html' }
      },
    },
  })

  expect(css).toContain('url(https://cdn.example.com/assets/_fonts')
  expect(css).not.toContain('url(/assets/_fonts')
  expect(html).toContain('href="https://cdn.example.com/assets/_fonts')
})

it('should honour renderBuiltUrl returning a relative URL for fonts', { timeout: 20_000 }, async () => {
  const { outDir, css, fonts } = await buildApp({
    experimental: { renderBuiltUrl: () => ({ relative: true }) },
  })

  const urls = [...css.matchAll(/url\((\.[^)]+\.woff2)\)/g)].map(([, url]) => url!)
  expect(urls.length).toBeGreaterThan(0)

  for (const url of urls) {
    expect(fonts).toContain(join('assets', url))
    expect((await fsp.stat(join(outDir, 'assets', url))).size).toBeGreaterThan(0)
  }
})

it('should prefix font URLs with the configured base', { timeout: 20_000 }, async () => {
  const { css, html, fonts } = await buildApp({ base: '/build/' })

  expect(css).toContain('url(/build/assets/_fonts')
  expect(html).toContain('href="/build/assets/_fonts')
  expect(fonts.some(file => file.endsWith('.woff2'))).toBe(true)
})

it('should emit font URLs from the server root by default', { timeout: 20_000 }, async () => {
  const { outDir, css, fonts } = await buildApp({})

  const urls = [...css.matchAll(/url\((\/assets\/_fonts\/[^)]+\.woff2)\)/g)].map(([, url]) => url!)
  expect(urls.length).toBeGreaterThan(0)

  for (const url of urls) {
    expect(fonts).toContain(url.slice(1))
    expect((await fsp.stat(join(outDir, url))).size).toBeGreaterThan(0)
  }
})

it.each(['/', '/build/'])('should serve fonts under base %s in dev', { timeout: 20_000 }, async (base) => {
  const server = await createServer({
    root,
    base,
    configFile: false,
    logLevel: 'silent',
    plugins: [fontless()],
    server: { host: '127.0.0.1', port: 0 },
  })

  try {
    await server.listen()
    const { port } = server.httpServer!.address() as { port: number }
    const origin = `http://127.0.0.1:${port}`

    // Vite serves CSS as a JS module in dev, so the CSS text is escaped
    const css = await fetch(`${origin}${base}src/style.css`).then(r => r.text())
    const [, fontURL] = css.match(new RegExp(`url\\(\\\\?"(${base}assets/_fonts/[^\\\\"]+)`)) || []
    expect(fontURL, `no font URL for base ${base} in dev CSS`).toBeDefined()

    // second request is served from the cache rather than refetched
    for (const _ of [0, 1]) {
      const font = await fetch(`${origin}${fontURL}`)
      expect(font.status).toBe(200)
      expect(font.headers.get('cache-control')).toContain('immutable')
      expect((await font.arrayBuffer()).byteLength).toBeGreaterThan(0)
    }

    const unknown = await fetch(`${origin}${base}assets/_fonts/unknown.woff2`)
    expect(unknown.headers.get('cache-control')).not.toContain('immutable')
  }
  finally {
    await server.close()
  }
})

it('should fail the build if a font cannot be downloaded', { timeout: 20_000 }, async () => {
  const server = createHTTPServer((_req, res) => {
    res.statusCode = 404
    res.end('Not Found')
  }).listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const { port } = server.address() as { port: number }

  try {
    await expect(buildApp({}, {
      families: [{ name: 'Poppins', src: `http://127.0.0.1:${port}/missing.woff2` }],
    })).rejects.toThrow(/404/)
  }
  finally {
    server.close()
  }
})
