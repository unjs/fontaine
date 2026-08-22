import type { Storage, StorageValue } from 'unstorage'
import type { FontlessOptions } from './types'

import { dirname, resolve } from 'node:path'
import { cwd } from 'node:process'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import memoryDriver from 'unstorage/drivers/memory'

interface FontlessStorageContext {
  /** The Vite project root, which a user-provided relative cache directory is resolved against. */
  root?: string
  /** Vite's resolved `cacheDir`; the default cache directory is created as a sibling of it. */
  cacheDir?: string
}

function isStorage(cache: unknown): cache is Storage<StorageValue> {
  return !!cache && typeof cache === 'object' && typeof (cache as Storage).getItem === 'function'
}

export function createFontlessStorage(cache?: FontlessOptions['cache'], context: FontlessStorageContext = {}): Storage<StorageValue> {
  if (cache === false) {
    return createStorage({ driver: memoryDriver() })
  }

  if (isStorage(cache)) {
    return cache
  }

  const root = context.root ?? cwd()
  const dir = typeof cache === 'string' ? cache : cache?.dir

  const base = dir
    ? resolve(root, dir)
    : resolve(dirname(context.cacheDir ?? resolve(root, 'node_modules/.vite')), '.cache/fontless/meta')

  return createStorage({ driver: fsDriver({ base }) })
}
