import type { FontlessOptions } from './types'

import { DEFAULT_CATEGORY_FALLBACKS } from 'fontaine'
import { providers } from 'unifont'

interface DefaultValues {
  weights: [400]
  styles: ['normal', 'italic']
  subsets: string[]
  fallbacks: typeof DEFAULT_CATEGORY_FALLBACKS
}

export const defaultValues: DefaultValues = {
  weights: [400] as const,
  styles: ['normal', 'italic'] as const,
  subsets: [
    'cyrillic-ext',
    'cyrillic',
    'greek-ext',
    'greek',
    'vietnamese',
    'latin-ext',
    'latin',
  ],
  fallbacks: {
    'serif': DEFAULT_CATEGORY_FALLBACKS.serif,
    'sans-serif': DEFAULT_CATEGORY_FALLBACKS['sans-serif'],
    'monospace': DEFAULT_CATEGORY_FALLBACKS.monospace,
    'cursive': DEFAULT_CATEGORY_FALLBACKS.handwriting,
    'fantasy': DEFAULT_CATEGORY_FALLBACKS.display,
    'system-ui': DEFAULT_CATEGORY_FALLBACKS['sans-serif'],
    'ui-serif': DEFAULT_CATEGORY_FALLBACKS.serif,
    'ui-sans-serif': DEFAULT_CATEGORY_FALLBACKS['sans-serif'],
    'ui-monospace': DEFAULT_CATEGORY_FALLBACKS.monospace,
    'ui-rounded': [],
    'emoji': [],
    'math': [],
    'fangsong': [],
  },
} satisfies FontlessOptions['defaults']

export const defaultOptions: FontlessOptions = {
  processCSSVariables: 'font-prefixed-only',
  experimental: {
    disableLocalFallbacks: false,
  },
  defaults: {},
  assets: {},
  local: {},
  google: {},
  adobe: {
    id: '',
  },
  providers: {
    adobe: providers.adobe,
    google: providers.google,
    googleicons: providers.googleicons,
    bunny: providers.bunny,
    fontshare: providers.fontshare,
    fontsource: providers.fontsource,
  },
}
