import { promises as fsp } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join } from 'pathe'
import { build } from 'vite'
import { afterAll, expect, it } from 'vitest'

const outDirs: string[] = []

afterAll(async () => {
  await Promise.all(outDirs.map(dir => fsp.rm(dir, { recursive: true, force: true })))
})

it('should prefix font URLs with the configured base', { timeout: 20_000 }, async () => {
  const root = fileURLToPath(new URL('../examples/vanilla-app', import.meta.url))
  const outDir = await fsp.mkdtemp(join(tmpdir(), 'fontless-base-'))
  outDirs.push(outDir)

  await build({
    root,
    base: '/build/',
    logLevel: 'silent',
    build: { outDir, emptyOutDir: true },
  })

  const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outDir }))

  const css = files.find(file => file.endsWith('.css'))!
  expect(await readFile(join(outDir, css), 'utf-8')).toContain('url(/build/assets/_fonts')

  const html = files.find(file => file.endsWith('.html'))!
  expect(await readFile(join(outDir, html), 'utf-8')).toContain('href="/build/assets/_fonts')

  expect(files.some(file => file.startsWith('assets/_fonts/') && file.endsWith('.woff2'))).toBe(true)
})
