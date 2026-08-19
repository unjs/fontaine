import type { Storage } from 'unstorage'
import type { FontlessOptions } from '../src/types'
import { mkdtemp, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStorage } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import { build } from 'vite'
import { describe, expect, it } from 'vitest'
import { fontless } from '../src/vite'

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), 'fontless-fixture-'))
  await writeFile(join(root, 'index.html'), '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body></body></html>')
  await writeFile(join(root, 'style.css'), 'body { font-family: "Poppins", sans-serif }')
  return root
}

async function buildFixture(root: string, cache?: FontlessOptions['cache']) {
  await build({
    root,
    logLevel: 'silent',
    build: { outDir: join(root, 'dist') },
    plugins: [fontless({ cache, families: [{ name: 'Poppins', provider: 'google' }] })],
  })
}

describe('cache option', () => {
  it('should cache font metadata and assets next to vite\'s cache directory by default', { timeout: 30_000 }, async () => {
    const root = await createFixture()
    await buildFixture(root)

    expect(await readdir(join(root, '.cache/fontless/meta'))).not.toEqual([])
  })

  it('should cache font metadata and assets in a custom directory', { timeout: 30_000 }, async () => {
    const root = await createFixture()
    await buildFixture(root, 'my-cache')

    expect(await readdir(join(root, 'my-cache'))).not.toEqual([])
  })

  it('should use a provided unstorage instance', { timeout: 30_000 }, async () => {
    const root = await createFixture()
    const storage: Storage = createStorage({ driver: memoryDriver() })
    await buildFixture(root, storage)

    expect(await storage.getKeys()).not.toEqual([])
  })

  it('should not write a cache to disk when disabled', { timeout: 30_000 }, async () => {
    const root = await createFixture()
    await buildFixture(root, false)

    expect((await readdir(root)).sort()).toEqual(['dist', 'index.html', 'style.css'])
  })
})
