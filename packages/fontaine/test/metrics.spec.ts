import { fromUrl } from '@capsizecss/unpack'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readMetrics } from '../src/metrics'

const mockFont = {
  ascent: 2000,
  descent: -500,
  lineGap: 200,
  unitsPerEm: 2048,
  xWidthAvg: 1000,
}

vi.mock('@capsizecss/unpack', () => ({
  fromUrl: vi.fn(),
}))

vi.mock('@capsizecss/unpack/fs', () => ({
  fromFile: vi.fn(),
}))

describe('readMetrics', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should cache url requests and only make one network call for concurrent requests', async () => {
    const url = 'https://example.com/font.ttf'

    let resolvePromise: (value: any) => void
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    vi.mocked(fromUrl).mockReturnValue(delayedPromise as Promise<any>)

    const promises = Array.from({ length: 200 }, () => readMetrics(url))

    resolvePromise!(mockFont)

    const results = await Promise.all(promises)

    expect(fromUrl).toHaveBeenCalledTimes(1)

    results.forEach((result) => {
      expect(result).toEqual(mockFont)
    })
  })
})
