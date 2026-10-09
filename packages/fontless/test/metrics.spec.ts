import type { Provider, ProviderContext } from 'unifont'
import type { FontlessOptions } from '../src/types'
import { promises as fsp } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readMetrics } from 'fontaine'
import { createStorage } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import { createServer } from 'vite'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { fontless } from '../src'

vi.mock('fontaine', async (importOriginal) => {
  const fontaine = await importOriginal<typeof import('fontaine')>()
  return { ...fontaine, readMetrics: vi.fn(fontaine.readMetrics) }
})

const scratchDirs: string[] = []
const metrics = { ascent: 1000, descent: -250, lineGap: 0, unitsPerEm: 1000, xWidthAvg: 500 }

afterEach(() => {
  vi.mocked(readMetrics).mockRestore()
})

afterAll(async () => {
  await Promise.all(scratchDirs.map(dir => fsp.rm(dir, { recursive: true, force: true })))
})

function createStubProvider(url: string) {
  return Object.assign(
    (_ctx: ProviderContext) => ({
      resolveFont: () => ({ fonts: [{ src: [{ url, format: 'woff2' }], weight: 400 }] }),
    }),
    { _name: 'stub', _options: {} },
  ) as unknown as Provider
}

async function transformStyles(url: string, options: FontlessOptions = {}) {
  const root = await fsp.realpath(await fsp.mkdtemp(join(tmpdir(), 'fontless-metrics-')))
  scratchDirs.push(root)
  await fsp.writeFile(join(root, 'style.css'), `body { font-family: 'Switzer', sans-serif }`)

  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [fontless({ provider: 'stub', providers: { stub: () => createStubProvider(url) }, cache: false, ...options })],
  })

  try {
    return (await server.transformRequest('/style.css'))!.code
  }
  finally {
    await server.close()
  }
}

describe('fallback metrics', () => {
  it('should retry reading metrics from the font', async () => {
    const url = 'https://cdn.example.com/switzer-flaky.woff2'
    const read = vi.mocked(readMetrics)
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(metrics)

    const code = await transformStyles(url)

    expect(code).toContain('Switzer Fallback: Arial')
    expect(read.mock.calls.filter(([source]) => source === url)).toHaveLength(2)
  })

  it('should fail when metrics cannot be read from the font', async () => {
    await expect(transformStyles('https://127.0.0.1:1/switzer.woff2'))
      .rejects
      .toThrow('Could not read metrics for `Switzer` from `https://127.0.0.1:1/switzer.woff2`.')
  })

  it('should read metrics of remote fonts from the cache', async () => {
    const url = 'https://cdn.example.com/switzer.woff2'
    const read = vi.mocked(readMetrics).mockResolvedValue(metrics)
    const cache = createStorage({ driver: memoryDriver() })

    const first = await transformStyles(url, { cache })
    const second = await transformStyles(url, { cache })

    for (const code of [first, second]) {
      expect(code).toContain('Switzer Fallback: Arial')
      expect(code).toContain('size-adjust: 112.1577%')
    }
    expect(read.mock.calls.filter(([source]) => source === url)).toHaveLength(1)
  })
})
