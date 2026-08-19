import { promises as fsp } from 'node:fs'
import { readFile } from 'node:fs/promises'
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

it('should prefix font URLs with the configured base', { timeout: 20_000 }, async () => {
  const outDir = await fsp.mkdtemp(join(tmpdir(), 'fontless-base-'))
  outDirs.push(outDir)

  await build({
    root,
    base: '/build/',
    configFile: false,
    logLevel: 'silent',
    plugins: [fontless({ families: [{ name: 'Poppins', preload: true }] })],
    build: { outDir, emptyOutDir: true },
  })

  const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outDir }))

  const css = files.find(file => file.endsWith('.css'))!
  expect(await readFile(join(outDir, css), 'utf-8')).toContain('url(/build/assets/_fonts')

  const html = files.find(file => file.endsWith('.html'))!
  expect(await readFile(join(outDir, html), 'utf-8')).toContain('href="/build/assets/_fonts')

  expect(files.some(file => file.startsWith('assets/_fonts/') && file.endsWith('.woff2'))).toBe(true)
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
