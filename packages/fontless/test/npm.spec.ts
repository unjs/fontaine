import { promises as fsp } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { build, createServer } from 'vite'
import { afterAll, expect, it } from 'vitest'
import { fontless } from '../src'

const scratchDirs: string[] = []

afterAll(async () => {
  await Promise.all(scratchDirs.map(dir => fsp.rm(dir, { recursive: true, force: true })))
})

const html = '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body></body></html>'

/**
 * Creates an app whose only font package is installed above its root, as pnpm's isolated
 * store and hoisting to a monorepo root both do.
 */
async function createWorkspace() {
  const workspace = await fsp.mkdtemp(join(tmpdir(), 'fontless-npm-'))
  scratchDirs.push(workspace)

  const root = join(workspace, 'app')
  await fsp.mkdir(root)
  await fsp.writeFile(join(root, 'index.html'), html)
  await fsp.writeFile(join(root, 'style.css'), `body { font-family: 'Inter' }`)
  await fsp.writeFile(join(root, 'package.json'), JSON.stringify({ name: 'app', dependencies: { '@fontsource/inter': '^5.0.0' } }))

  const pkgDir = join(workspace, 'node_modules/@fontsource/inter')
  await fsp.mkdir(join(pkgDir, 'files'), { recursive: true })
  await fsp.writeFile(join(pkgDir, 'package.json'), JSON.stringify({ name: '@fontsource/inter', version: '5.0.0', exports: { './*': './*' } }))
  await fsp.writeFile(join(pkgDir, 'index.css'), `@font-face { font-family: 'Inter'; font-style: normal; font-weight: 400; src: url(./files/inter-latin-400-normal.woff2?v=1) format('woff2'); }`)
  await fsp.writeFile(join(pkgDir, 'files/inter-latin-400-normal.woff2'), 'local-font-bytes')

  return { workspace, root }
}

it('should emit fonts from a locally installed package', async () => {
  const { workspace, root } = await createWorkspace()
  const outDir = join(workspace, 'dist')

  await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [fontless({ provider: 'npm' })],
    build: { outDir, emptyOutDir: true },
  })

  const files = await Array.fromAsync(fsp.glob('**/*', { cwd: outDir }))
  const font = files.find(file => file.endsWith('.woff2'))

  expect(font).toBeTruthy()
  expect(await fsp.readFile(join(outDir, font!), 'utf-8')).toBe('local-font-bytes')
})

it('should serve fonts from a locally installed package during dev', async () => {
  const { root } = await createWorkspace()
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0 },
    plugins: [fontless({ provider: 'npm' })],
  })

  try {
    await server.listen()
    const transformed = await server.transformRequest('/style.css')
    const file = transformed!.code.match(/\/assets\/_fonts\/([\w-]+\.woff2)/)![1]

    const response = await fetch(new URL(`/assets/_fonts/${file}`, server.resolvedUrls!.local[0]))

    expect(await response.text()).toBe('local-font-bytes')
  }
  finally {
    await server.close()
  }
})
