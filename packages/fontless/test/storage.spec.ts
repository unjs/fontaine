import { mkdtemp, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStorage } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import { describe, expect, it } from 'vitest'
import { createFontlessStorage } from '../src/storage'

const scratchDir = () => mkdtemp(join(tmpdir(), 'fontless-cache-'))

describe('createFontlessStorage', () => {
  it('should default to a directory alongside vite\'s cacheDir', async () => {
    const dir = await scratchDir()
    const storage = createFontlessStorage(undefined, { root: join(dir, 'src'), cacheDir: join(dir, 'node_modules/.vite') })

    await storage.setItem('key', 'value')

    expect(await readdir(join(dir, 'node_modules/.cache/fontless/meta'))).toEqual(['key'])
  })

  it('should write to a custom directory resolved from the root', async () => {
    const root = await scratchDir()
    const storage = createFontlessStorage('.cache/fonts', { root })

    await storage.setItem('key', 'value')

    expect(await readdir(join(root, '.cache/fonts'))).toEqual(['key'])
    expect(await storage.getItem('key')).toBe('value')
  })

  it('should accept a directory via object syntax', async () => {
    const root = await scratchDir()
    const storage = createFontlessStorage({ dir: 'custom' }, { root })

    await storage.setItem('key', 'value')

    expect(await readdir(join(root, 'custom'))).toEqual(['key'])
  })

  it('should not persist to disk when cache is disabled', async () => {
    const root = await scratchDir()
    const storage = createFontlessStorage(false, { root })

    await storage.setItem('key', 'value')

    expect(await storage.getItem('key')).toBe('value')
    expect(await readdir(root)).toEqual([])
  })

  it('should use a provided unstorage instance as-is', () => {
    const custom = createStorage({ driver: memoryDriver() })
    expect(createFontlessStorage(custom)).toBe(custom)
  })
})
