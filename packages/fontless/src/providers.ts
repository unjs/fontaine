import type { ProviderFactory } from 'unifont'
import type { FontlessOptions } from './types'

import { createJiti } from 'jiti'

type AnyProviderFactory = ProviderFactory<string, any, any>

export async function resolveProviders(_providers: FontlessOptions['providers'] = {}, opts: { root: string, alias: Record<string, string> }): Promise<Record<string, AnyProviderFactory>> {
  const jiti = createJiti(opts.root, { alias: opts.alias })

  const providers = { ..._providers }
  for (const key in providers) {
    const value = providers[key]
    if (value === false) {
      delete providers[key]
    }
    if (typeof value === 'string') {
      providers[key] = await jiti.import<AnyProviderFactory>(value, { default: true })
    }
  }
  return providers as Record<string, AnyProviderFactory>
}
