import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createJiti } from 'jiti'
import { describe, expect, it, vi } from 'vitest'
import { resolveProviders } from '../src/providers'

vi.mock('jiti', () => ({ createJiti: vi.fn() }))

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

  it('should fall back to jiti for providers node cannot load', async () => {
    const provider = () => ({ resolveFont: () => undefined })
    vi.mocked(createJiti).mockReturnValue({ import: () => Promise.resolve(provider) } as unknown as ReturnType<typeof createJiti>)

    const providers = await resolveProviders({ custom: './does-not-exist.ts' }, opts)

    expect(providers.custom).toBe(provider)
  })

  it('should import providers without a default export', async () => {
    const root = await mkdtemp(join(tmpdir(), 'fontless-provider-'))
    await writeFile(join(root, 'provider.mjs'), 'export const resolveFont = () => undefined')

    const providers = await resolveProviders({ custom: './provider.mjs' }, { root, alias: {} })

    expect(typeof (providers.custom as any).resolveFont).toBe('function')
  })

  it('should import providers node resolves itself', async () => {
    const providers = await resolveProviders({ custom: 'node:os' }, opts)

    expect(typeof (providers.custom as any).tmpdir).toBe('function')
  })

  it('should import providers referenced by an alias subpath', async () => {
    const root = await mkdtemp(join(tmpdir(), 'fontless-provider-'))
    await writeFile(join(root, 'provider.mjs'), 'export default () => ({ resolveFont: () => undefined })')

    const providers = await resolveProviders(
      { custom: '#providers/provider.mjs' },
      { root, alias: { '#providers': root } },
    )

    expect(typeof providers.custom).toBe('function')
  })

  it('should import providers referenced by alias', async () => {
    const root = await mkdtemp(join(tmpdir(), 'fontless-provider-'))
    await writeFile(join(root, 'provider.mjs'), 'export default () => ({ resolveFont: () => undefined })')

    const providers = await resolveProviders(
      { custom: '#provider' },
      { root, alias: { '#unrelated': root, '#provider': join(root, 'provider.mjs') } },
    )

    expect(typeof providers.custom).toBe('function')
  })
})
