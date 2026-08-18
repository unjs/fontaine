import { promises as fsp } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join } from 'pathe'
import { build } from 'vite7'
import { afterAll, describe, expect, it } from 'vitest'

const outDirs: string[] = []

afterAll(async () => {
  await Promise.all(outDirs.map(dir => fsp.rm(dir, { recursive: true, force: true })))
})

describe.each(['vanilla-app', 'qwik-app'])('fontless builds %s with vite 7', (fixture) => {
  it('should compile', { timeout: 20_000 }, async () => {
    const root = fileURLToPath(new URL(`../examples/${fixture}`, import.meta.url))
    const outDir = await fsp.mkdtemp(join(tmpdir(), 'fontless-vite-compat-'))
    outDirs.push(outDir)

    await build({
      root,
      logLevel: 'silent',
      build: { outDir, emptyOutDir: true },
    })

    const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outDir }))

    let found = false
    for (const file of files) {
      if (file.endsWith('.css') || file.endsWith('.js')) {
        const content = await readFile(join(outDir, file), 'utf-8')
        if (content.includes('url(/assets/_fonts')) {
          found = true
          break
        }
      }
    }
    expect(found).toBe(true)
    expect(files.some(file => file.endsWith('.woff2'))).toBe(true)
  })
})
