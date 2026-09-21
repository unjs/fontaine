import { tmpdir } from 'node:os'
import { describe, expect, it, vi } from 'vitest'
import { resolveProviders } from '../src/providers'

vi.mock('jiti', () => {
  throw new Error('Cannot find package \'jiti\'')
})

describe('resolveProviders without jiti', () => {
  it('should ask for jiti when a provider cannot be imported', async () => {
    await expect(resolveProviders({ custom: './does-not-exist.ts' }, { root: tmpdir(), alias: {} }))
      .rejects
      .toThrow(/install `jiti` to load it/)
  })
})
