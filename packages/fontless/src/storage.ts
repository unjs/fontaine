import type { FontlessOptions, FontlessStorage } from './types'

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { cwd } from 'node:process'

interface FontlessStorageContext {
  /** The Vite project root, which a user-provided relative cache directory is resolved against. */
  root?: string
  /** Vite's resolved `cacheDir`; the default cache directory is created as a sibling of it. */
  cacheDir?: string
}

function isStorage(cache: unknown): cache is FontlessStorage {
  return !!cache && typeof cache === 'object' && typeof (cache as FontlessStorage).getItem === 'function'
}

function createMemoryStorage(): FontlessStorage {
  const store = new Map<string, unknown>()
  return {
    getItem: async key => store.get(key) ?? null,
    setItem: async (key, value) => void store.set(key, value),
    getItemRaw: async key => store.get(key) ?? null,
    setItemRaw: async (key, value) => void store.set(key, value),
  }
}

/** Cache keys are namespaced with `:` (and `/` by the npm provider); both map to directories on disk. */
function keyToPath(base: string, key: string) {
  return join(base, ...key.split(/[:/\\]+/).filter(Boolean))
}

async function write(path: string, contents: string | Uint8Array) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, contents)
}

async function read(path: string) {
  try {
    return await readFile(path)
  }
  catch {
    return null
  }
}

function createFsStorage(base: string): FontlessStorage {
  return {
    async getItem(key) {
      const contents = await read(keyToPath(base, key))
      if (contents === null) {
        return null
      }
      try {
        return JSON.parse(contents.toString('utf8'))
      }
      catch {
        return contents.toString('utf8')
      }
    },
    setItem(key, value) {
      return write(keyToPath(base, key), typeof value === 'string' ? value : JSON.stringify(value))
    },
    getItemRaw(key) {
      return read(keyToPath(base, key))
    },
    setItemRaw(key, value) {
      return write(keyToPath(base, key), value)
    },
  }
}

export function createFontlessStorage(cache?: FontlessOptions['cache'], context: FontlessStorageContext = {}): FontlessStorage {
  if (cache === false) {
    return createMemoryStorage()
  }

  if (isStorage(cache)) {
    return cache
  }

  const root = context.root ?? cwd()
  const dir = typeof cache === 'string' ? cache : cache?.dir

  const base = dir
    ? resolve(root, dir)
    : resolve(dirname(context.cacheDir ?? resolve(root, 'node_modules/.vite')), '.cache/fontless/meta')

  return createFsStorage(base)
}
