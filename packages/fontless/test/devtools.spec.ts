import type { DevframeDefinition } from 'devframe'
import type { AddressInfo } from 'node:net'
import type { FontlessDevframeState } from '../src/devtools'
import type { FontlessOptions, ManualFontDetails, ProviderFontDetails } from '../src/types'
import { promises as fsp } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { initDevframe } from 'devframe/initiate'
import { createRpcClient } from 'devframe/rpc/client'
import { createWsRpcChannel } from 'devframe/rpc/transports/ws-client'
import { createServer as createViteServer } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'
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
      families: [{
        ...poppins,
        id: 0,
        css: `@font-face {\n  font-family: 'Poppins';\n  src: local("Poppins"), url("/_fonts/poppins.woff2") format(woff2);\n  font-display: swap;\n  font-weight: 400;\n  font-style: normal;\n}\n`,
      }],
    })

    devframe.exposeFont(blackFox)
    const { families } = await getState()
    expect(families.map(family => family.fontFamily)).toEqual(['Poppins', 'Black Fox'])
    expect(families[1]).toMatchObject({ id: 1, type: 'manual' })
  })

  it('should ignore a family that has already been exposed', async () => {
    const devframe = createFontlessDevframe()
    devframe.exposeFont(poppins)
    devframe.exposeFont(structuredClone(poppins))
    const { getState } = await mount(devframe.definition)
    devframe.exposeFont(structuredClone(poppins))

    expect((await getState()).families).toHaveLength(1)
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
      expect((await host.getState()).families.map(family => family.fontFamily)).toEqual(['Poppins', 'Black Fox'])
    }
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
    return { server, plugin }
  }

  it('should install the devframe in Vite DevTools with the fonts resolved during dev', async () => {
    const { server, plugin } = await startServer()
    await server.transformRequest('/inter.css')

    const definitions: DevframeDefinition[] = []
    const ctx = { install: async (definition: DevframeDefinition) => void definitions.push(definition) }
    await plugin!.devtools.setup(ctx)
    await plugin!.devtools.setup(ctx)
    expect(definitions[0]).toBe(definitions[1])

    const { getState } = await mount(definitions[0]!)
    await server.transformRequest('/roboto.css')

    expect((await getState()).families.map(family => family.fontFamily)).toEqual(['Inter', 'Roboto'])
  })

  it('should not add a DevTools panel when `devtools` is disabled', async () => {
    const { server, plugin } = await startServer({ devtools: false })
    await server.transformRequest('/inter.css')

    expect(plugin).toBeUndefined()
  })
})
