import { promises as fsp } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join } from 'pathe'
import { build as buildVite8 } from 'vite'
import { build as buildVite7 } from 'vite7'
import { afterAll, describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../examples/vanilla-app', import.meta.url))
const outDirs: string[] = []

afterAll(async () => {
  await Promise.all(outDirs.map(dir => fsp.rm(dir, { recursive: true, force: true })))
})

describe.each([
  ['vite 8', buildVite8],
  ['vite 7', buildVite7],
])('fontless builds the vanilla-app with %s', (_version, build) => {
  it('should compile', { timeout: 20_000 }, async () => {
    const outDir = await fsp.mkdtemp(join(tmpdir(), 'fontless-vite-compat-'))
    outDirs.push(outDir)

    await build({
      root,
      logLevel: 'silent',
      build: { outDir, emptyOutDir: true },
    })

    const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outDir }))
    const css = files.find(file => file.endsWith('.css'))!
    const content = await readFile(join(outDir, css), 'utf-8')

    expect(content).toContain('url(/assets/_fonts')
    expect(files.some(file => file.endsWith('.woff2'))).toBe(true)
  })
})
