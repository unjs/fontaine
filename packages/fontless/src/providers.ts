import type { ProviderFactory } from 'unifont'
import type { FontlessOptions } from './types'

import { pathToFileURL } from 'node:url'
import { resolveModulePath } from 'exsolve'

type AnyProviderFactory = ProviderFactory<string, any, any>

interface ResolveProvidersOptions {
  root: string
  alias: Record<string, string>
}

export async function resolveProviders(_providers: FontlessOptions['providers'] = {}, opts: ResolveProvidersOptions): Promise<Record<string, AnyProviderFactory>> {
  const providers = { ..._providers }
  for (const key in providers) {
    const value = providers[key]
    if (value === false) {
      delete providers[key]
    }
    if (typeof value === 'string') {
      providers[key] = await importProvider(value, opts)
    }
  }
  return providers as Record<string, AnyProviderFactory>
}

async function importProvider(specifier: string, opts: ResolveProvidersOptions): Promise<AnyProviderFactory> {
  const aliased = resolveAlias(specifier, opts.alias)
  const path = resolveModulePath(aliased, { from: `${opts.root}/`, try: true })

  try {
    const module = await import(path ? pathToFileURL(path).href : aliased)
    return module.default ?? module
  }
  catch (error) {
    return await importProviderWithJiti(specifier, opts, error)
  }
}

async function importProviderWithJiti(specifier: string, opts: ResolveProvidersOptions, cause: unknown): Promise<AnyProviderFactory> {
  let createJiti: typeof import('jiti').createJiti
  try {
    ({ createJiti } = await import('jiti'))
  }
  catch {
    throw new Error(`Could not load the font provider \`${specifier}\`. If it uses syntax Node cannot run directly, such as TypeScript with non-erasable syntax, install \`jiti\` to load it.`, { cause })
  }

  const jiti = createJiti(opts.root, { alias: opts.alias })
  return await jiti.import<AnyProviderFactory>(specifier, { default: true })
}

function resolveAlias(specifier: string, alias: Record<string, string>): string {
  for (const key in alias) {
    if (specifier === key || specifier.startsWith(`${key}/`)) {
      return alias[key] + specifier.slice(key.length)
    }
  }
  return specifier
}
