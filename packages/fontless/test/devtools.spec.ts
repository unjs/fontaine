import type { DevframeDefinition } from 'devframe'
import type { AddressInfo } from 'node:net'
import type { FontlessDevframeState } from '../src/devtools'
import type { FontlessOptions, ManualFontDetails, ProviderFontDetails } from '../src/types'
import type { FontFamilyUsage } from '../src/utils'
import { promises as fsp } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { initDevframe } from 'devframe/initiate'
import { createRpcClient } from 'devframe/rpc/client'
import { createWsRpcChannel } from 'devframe/rpc/transports/ws-client'
import { createServer as createViteServer } from 'vite'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fontless } from '../src'
import { createFontlessDevframe } from '../src/devtools'

const cleanups: Array<() => Promise<void> | void> = []

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map(cleanup => cleanup()))
})

async function mount(definition: DevframeDefinition) {
  const base = `/__${definition.id}/`
  const server = createServer()
  const instance = initDevframe(definition, { base, server, auth: false })
  server.on('request', instance.nodeMiddleware)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  await instance.ready
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  const channel = createWsRpcChannel({ url: `${origin.replace('http', 'ws')}${base}__ws`, authToken: 'test' })
  const rpc = createRpcClient<any, any>({}, { channel })

  cleanups.push(async () => {
    channel.close()
    await instance.close()
    await new Promise(resolve => server.close(resolve))
  })

  return {
    origin,
    base,
    getState: () => rpc.$call('devframe:rpc:server-state:get', 'fontless:fonts') as Promise<FontlessDevframeState>,
  }
}

const poppins: ProviderFontDetails = {
  type: 'auto',
  fontFamily: 'Poppins',
  provider: 'google',
  fonts: [{ src: [{ name: 'Poppins' }, { url: '/_fonts/poppins.woff2', format: 'woff2' }], weight: 400, style: 'normal' }],
}

const blackFox: ManualFontDetails = {
  type: 'manual',
  fontFamily: 'Black Fox',
  fonts: [{ src: [{ url: '/black-fox.ttf', format: 'truetype' }] }],
}
// The metrics database fallbacks are rendered from is loaded on first use
const FALLBACK_TIMEOUT = 10_000

function poppinsUsage(fallbacks: string[] = ['Arial'], preloads: string[] = []): FontFamilyUsage {
  return { fontFamily: 'Poppins', resolved: true, fallbacks, preloads }
}

describe('createFontlessDevframe', () => {
  it('should describe a devframe mounted at `/__fontless/` by default', () => {
    const { definition } = createFontlessDevframe()
    expect(definition).toMatchObject({
      id: 'fontless',
      name: 'Fonts',
      icon: 'carbon:text-font',
      packageName: 'fontless',
      basePath: undefined,
      capabilities: { build: false },
    })
  })

  it('should accept a custom id, name, icon and base path', () => {
    const { definition } = createFontlessDevframe({ id: 'fonts', name: 'Typefaces', icon: 'ph:text-aa', basePath: '/__fonts/' })
    expect(definition).toMatchObject({ id: 'fonts', name: 'Typefaces', icon: 'ph:text-aa', basePath: '/__fonts/' })
  })

  it('should share the options the panel is presented with', async () => {
    const ui = { primaryColor: '#00dc82', familiesOption: 'fonts.families', docsURL: 'https://fonts.nuxt.com' }
    const { getState } = await mount(createFontlessDevframe({ reportsUsage: true, ui }).definition)

    expect(await getState()).toMatchObject({ reportsUsage: true, ui })
    expect(Object.isFrozen(ui)).toBe(false)
  })

  it('should serve the client with relative asset URLs', async () => {
    const { origin, base } = await mount(createFontlessDevframe().definition)
    const response = await fetch(`${origin}${base}`)
    const html = await response.text()
    expect(response.status).toBe(200)
    expect(html).toContain('<base href="./" />')
    expect(html).toMatch(/src="\.\/assets\/[^"?]+\.js"/)
  })

  it('should share fonts exposed before and after setup', async () => {
    const devframe = createFontlessDevframe()
    devframe.exposeFont(poppins)
    const { getState } = await mount(devframe.definition)

    expect(await getState()).toEqual({
      root: process.cwd(),
      reportsUsage: false,
      ui: {},
      families: [{
        ...poppins,
        id: 0,
        css: `@font-face {\n  font-family: 'Poppins';\n  src: local("Poppins"), url("/_fonts/poppins.woff2") format(woff2);\n  font-display: swap;\n  font-weight: 400;\n  font-style: normal;\n}\n`,
        fallbackCSS: '',
        fallbacks: [],
        usages: [],
        global: false,
        preloads: [],
      }],
      unresolved: [],
      warnings: [],
    })

    devframe.exposeFont(blackFox)
    await vi.waitFor(async () => {
      const { families } = await getState()
      expect(families.map(family => family.fontFamily)).toEqual(['Poppins', 'Black Fox'])
      expect(families[1]).toMatchObject({ id: 1, type: 'manual' })
    })
  })

  it('should replace a family that is exposed again, keeping its id', async () => {
    const devframe = createFontlessDevframe()
    devframe.exposeFont(blackFox)
    devframe.exposeFont(poppins)
    devframe.exposeFont({ ...poppins, type: 'override' })
    const { getState } = await mount(devframe.definition)

    expect((await getState()).families.map(({ id, type }) => ({ id, type }))).toEqual([{ id: 0, type: 'manual' }, { id: 1, type: 'override' }])
  })

  it('should not render `@font-face` declarations for the `local` provider', async () => {
    const devframe = createFontlessDevframe()
    devframe.exposeFont({ ...poppins, provider: 'local' })
    const { getState } = await mount(devframe.definition)

    expect((await getState()).families[0]!.css).toBe('')
  })

  it('should share fonts with every host it is set up in', async () => {
    const devframe = createFontlessDevframe()
    const first = await mount(devframe.definition)
    devframe.exposeFont(poppins)
    const second = await mount(devframe.definition)
    devframe.exposeFont(blackFox)

    for (const host of [first, second]) {
      await vi.waitFor(async () => {
        expect((await host.getState()).families.map(family => family.fontFamily)).toEqual(['Poppins', 'Black Fox'])
      })
    }
  })

  it('should combine the usages of a family', async () => {
    const devframe = createFontlessDevframe()
    const { getState } = await mount(devframe.definition)
    devframe.exposeUsage('/a.css', [poppinsUsage(['Arial'], ['/_fonts/poppins.woff2'])])
    devframe.exposeUsage('/b.css', [poppinsUsage(['Arial', 'Helvetica Neue']), poppinsUsage(['Arial'])])
    devframe.exposeUsage(undefined, [poppinsUsage([])])
    devframe.exposeFont(poppins)

    await vi.waitFor(async () => {
      const [family] = (await getState()).families
      expect(family).toMatchObject({
        usages: ['/a.css', '/b.css'],
        global: true,
        fallbacks: ['Arial', 'Helvetica Neue'],
        preloads: ['/_fonts/poppins.woff2'],
      })
      expect(family!.fallbackCSS).toContain('font-family: "Poppins Fallback: Arial"')
      expect(family!.fallbackCSS).toContain('font-family: "Poppins Fallback: Helvetica Neue"')
    }, FALLBACK_TIMEOUT)
  })

  it('should render fallbacks from an upright face where there is one', async () => {
    const devframe = createFontlessDevframe()
    const { getState } = await mount(devframe.definition)
    const italic = { ...poppins.fonts[0]!, style: 'italic', src: [{ url: 'file:///missing/italic.woff2' }] }
    const upright = { ...poppins.fonts[0]!, src: [{ url: new URL('../examples/vanilla-app/src/black-fox.ttf', import.meta.url).href }] }
    devframe.exposeFont({ ...poppins, fontFamily: 'Unknown', fonts: [italic, upright] })
    devframe.exposeUsage('/a.css', [{ ...poppinsUsage(), fontFamily: 'Unknown' }])

    await vi.waitFor(async () => {
      const { families, warnings } = await getState()
      expect(families[0]!.fallbackCSS).toContain('font-family: "Unknown Fallback: Arial"')
      expect(warnings).toEqual([])
    }, FALLBACK_TIMEOUT)
  })

  it('should list fallbacks that could not be rendered as warnings', async () => {
    const devframe = createFontlessDevframe()
    const { getState } = await mount(devframe.definition)
    devframe.exposeFont({ ...poppins, fontFamily: 'Unknown', fonts: [{ ...poppins.fonts[0]!, style: 'italic', src: [{ url: 'file:///missing/font.woff2' }] }] })
    devframe.exposeUsage('/a.css', [{ ...poppinsUsage(), fontFamily: 'Unknown' }])

    await vi.waitFor(async () => {
      const { families, warnings } = await getState()
      expect(families[0]!.fallbackCSS).toBe('')
      expect(warnings).toEqual([expect.stringContaining('missing/font.woff2')])
    }, FALLBACK_TIMEOUT)
  })

  it('should not render fallbacks again for usages it has already rendered', async () => {
    const devframe = createFontlessDevframe()
    devframe.exposeFont(poppins)
    devframe.exposeUsage('/a.css', [poppinsUsage(['Arial'])])
    devframe.exposeUsage('/a.css', [poppinsUsage(['Helvetica Neue'])])
    devframe.exposeUsage('/a.css', [poppinsUsage(['Helvetica Neue'])])
    const { getState } = await mount(devframe.definition)

    await vi.waitFor(async () => {
      const { fallbackCSS } = (await getState()).families[0]!
      expect(fallbackCSS).toContain('Poppins Fallback: Helvetica Neue')
      expect(fallbackCSS).not.toContain('Poppins Fallback: Arial')
    }, FALLBACK_TIMEOUT)
  })

  it('should list families that were used but not resolved', async () => {
    const devframe = createFontlessDevframe()
    const { getState } = await mount(devframe.definition)
    devframe.exposeUsage('/a.css', [
      { fontFamily: 'Missing', resolved: false, fallbacks: [], preloads: [] },
      { fontFamily: 'Helvetica', resolved: false, fallbacks: [], preloads: [] },
      { ...poppinsUsage(), resolved: false },
    ])
    devframe.exposeUsage('/b.css', [poppinsUsage()])

    await vi.waitFor(async () => {
      expect((await getState()).unresolved).toEqual([
        { fontFamily: 'Missing', system: false, usages: ['/a.css'] },
        { fontFamily: 'Helvetica', system: true, usages: ['/a.css'] },
      ])
    })
  })

  it('should forget the families a stylesheet no longer uses', async () => {
    const devframe = createFontlessDevframe()
    const { getState } = await mount(devframe.definition)
    devframe.exposeFont(poppins)
    devframe.exposeUsage('/a.css', [poppinsUsage(), { fontFamily: 'Missing', resolved: false, fallbacks: [], preloads: [] }])
    await vi.waitFor(async () => {
      const [family] = (await getState()).families
      expect(family!.usages).toEqual(['/a.css'])
      expect(family!.fallbackCSS).toContain('Poppins Fallback: Arial')
    }, FALLBACK_TIMEOUT)

    devframe.exposeUsage('/a.css', [])
    await vi.waitFor(async () => {
      const state = await getState()
      expect(state.families[0]).toMatchObject({ usages: [], fallbacks: [], fallbackCSS: '' })
      expect(state.unresolved).toEqual([])
    })
  })

  it('should list each warning once, up to a limit', async () => {
    const devframe = createFontlessDevframe()
    const { getState } = await mount(devframe.definition)
    for (let i = 0; i < 150; i++) {
      devframe.exposeWarning(`warning ${i % 120}`)
    }

    await vi.waitFor(async () => {
      const { warnings } = await getState()
      expect(warnings).toHaveLength(100)
      expect(warnings[0]).toBe('warning 0')
    })
  })
})

describe('fontless vite plugin devtools', () => {
  const stub = Object.assign(
    () => ({ resolveFont: () => ({ fonts: [{ src: [{ url: '/font.woff2', format: 'woff2' }], weight: 400 }] }) }),
    { _name: 'stub', _options: {} },
  )

  async function startServer(options: FontlessOptions = {}) {
    const root = await fsp.realpath(await fsp.mkdtemp(join(tmpdir(), 'fontless-devtools-')))
    await fsp.writeFile(join(root, 'inter.css'), `body { font-family: 'Inter' }`)
    await fsp.writeFile(join(root, 'roboto.css'), `body { font-family: 'Roboto' }`)
    const server = await createViteServer({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [fontless({ provider: 'stub', providers: { stub: () => stub as never }, ...options })],
    })
    cleanups.push(async () => {
      await server.close()
      await fsp.rm(root, { recursive: true, force: true })
    })
    const plugin = server.config.plugins.find(plugin => 'devtools' in plugin) as { devtools: { setup: (ctx: unknown) => Promise<void> } } | undefined
    return { root, server, plugin }
  }

  async function install(plugin: { devtools: { setup: (ctx: unknown) => Promise<void> } } | undefined) {
    const definitions: DevframeDefinition[] = []
    const ctx = { install: async (definition: DevframeDefinition) => void definitions.push(definition) }
    await plugin!.devtools.setup(ctx)
    await plugin!.devtools.setup(ctx)
    expect(definitions[0]).toBe(definitions[1])
    return mount(definitions[0]!)
  }

  it('should install the devframe in Vite DevTools with the fonts resolved during dev', async () => {
    const { root, server, plugin } = await startServer()
    await server.transformRequest('/inter.css')
    await server.transformRequest('/inter.css')

    const { getState } = await install(plugin)
    await server.transformRequest('/roboto.css')

    await vi.waitFor(async () => {
      const { families, reportsUsage } = await getState()
      expect(reportsUsage).toBe(true)
      expect(families.map(family => [family.fontFamily, family.usages])).toEqual([
        ['Inter', [join(root, 'inter.css')]],
        ['Roboto', [join(root, 'roboto.css')]],
      ])
    })
  })

  it('should expose families declared `global` and warnings logged while resolving', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { server, plugin } = await startServer({
      families: [
        { name: 'Inter', global: true, preload: true },
        { name: 'Roboto', global: true, provider: 'none' },
        { name: 'Lato', provider: 'missing' },
      ],
    })
    await server.transformIndexHtml('/', '<html><head></head><body></body></html>')
    await server.transformRequest('/roboto.css')
    await fsp.writeFile(join(server.config.root, 'lato.css'), `body { font-family: 'Lato' }`)
    await server.transformRequest('/lato.css')

    const { getState } = await install(plugin)

    await vi.waitFor(async () => {
      const state = await getState()
      expect(state.families.find(family => family.fontFamily === 'Inter')).toMatchObject({ global: true, preloads: ['/font.woff2'] })
      expect(state.unresolved.map(family => family.fontFamily)).toEqual(['Roboto'])
      expect(state.warnings).toEqual(['Unknown provider `missing` for font family `Lato`. Falling back to default providers.'])
    })
    expect(warn).toHaveBeenCalledWith('[fontless] Unknown provider `missing` for font family `Lato`. Falling back to default providers.')
    warn.mockRestore()
  })

  it('should forget the families a stylesheet stops using when CSS variables are not processed', async () => {
    const { root, server, plugin } = await startServer({ processCSSVariables: false })
    await server.transformRequest('/inter.css')
    const { getState } = await install(plugin)
    await vi.waitFor(async () => {
      expect((await getState()).families[0]!.usages).toEqual([join(root, 'inter.css')])
    })

    await fsp.writeFile(join(root, 'inter.css'), `body { color: red }`)
    server.moduleGraph.invalidateAll()
    await server.transformRequest('/inter.css')

    await vi.waitFor(async () => {
      expect((await getState()).families[0]!.usages).toEqual([])
    })
  })

  it('should not add a DevTools panel when `devtools` is disabled', async () => {
    const { server, plugin } = await startServer({ devtools: false })
    await server.transformRequest('/inter.css')

    expect(plugin).toBeUndefined()
  })
})
