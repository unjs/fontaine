import { Buffer } from 'node:buffer'
import { describe, expect, it, vi } from 'vitest'

// `subset-font` is an optional peer dependency, so this file simulates a project that has
// not installed it. It lives on its own so the mock cannot leak into the other suites.
vi.mock('subset-font', () => {
  throw new Error('Cannot find package \'subset-font\'')
})

describe('subsetFontData without `subset-font` installed', () => {
  it('should ask for the package to be installed', async () => {
    const { subsetFontData } = await import('../src/subset')

    const subsetting = subsetFontData(Buffer.from('font'), 'Hand', 'https://example.com/font.woff2')

    await expect(subsetting).rejects.toThrow('requires the `subset-font` package')
  })

  it('should retry the import on a later font rather than caching the failure', async () => {
    const { subsetFontData } = await import('../src/subset')

    await expect(subsetFontData(Buffer.from('font'), 'Hand', 'https://example.com/font.woff2')).rejects.toThrow()
    await expect(subsetFontData(Buffer.from('font'), 'Hand', 'https://example.com/other.woff2')).rejects.toThrow()
  })
})
