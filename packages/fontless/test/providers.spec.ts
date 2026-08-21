import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveProviders } from '../src/providers'

const opts = { root: tmpdir(), alias: {} }

describe('resolveProviders', () => {
  it('should default to an empty set of providers', async () => {
    expect(await resolveProviders(undefined, opts)).toEqual({})
  })

  it('should keep provider factories as-is', async () => {
    const provider = () => ({ resolveFont: () => undefined })

    expect(await resolveProviders({ custom: provider as any }, opts)).toEqual({ custom: provider })
  })

  it('should drop providers disabled with `false`', async () => {
    expect(await resolveProviders({ google: false }, opts)).toEqual({})
  })

  it('should import providers referenced by path', async () => {
    const root = await mkdtemp(join(tmpdir(), 'fontless-provider-'))
    await writeFile(join(root, 'provider.mjs'), 'export default () => ({ resolveFont: () => undefined })')

    const providers = await resolveProviders({ custom: './provider.mjs' }, { root, alias: {} })

    expect(typeof providers.custom).toBe('function')
  })

  it('should import providers referenced by alias', async () => {
    const root = await mkdtemp(join(tmpdir(), 'fontless-provider-'))
    await writeFile(join(root, 'provider.mjs'), 'export default () => ({ resolveFont: () => undefined })')

    const providers = await resolveProviders(
      { custom: '#provider' },
      { root, alias: { '#provider': join(root, 'provider.mjs') } },
    )

    expect(typeof providers.custom).toBe('function')
  })
})
