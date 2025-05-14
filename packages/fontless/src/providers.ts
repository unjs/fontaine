import { createJiti } from 'jiti'
import type { ProviderFactory } from 'unifont'

import type { FontlessOptions } from './types'

export async function resolveProviders(_providers: FontlessOptions['providers'] = {}, opts: { root: string, alias: Record<string, string> }) {
  const jiti = createJiti(opts.root, { alias: opts.alias })

  const providers = { ..._providers }
  for (const key in providers) {
    const value = providers[key]
    if (value === false) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete providers[key]
    }
    if (typeof value === 'string') {
      providers[key] = await jiti.import<ProviderFactory>(value, { default: true })
    }
  }
  return providers as Record<string, ProviderFactory>
}
