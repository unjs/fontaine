import { providers } from 'unifont'

import type { FontlessOptions } from './types'

export const defaultValues = {
  weights: [400],
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
    'serif': ['Times New Roman'],
    'sans-serif': ['Arial'],
    'monospace': ['Courier New'],
    'cursive': [],
    'fantasy': [],
    'system-ui': [
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
    ],
    'ui-serif': ['Times New Roman'],
    'ui-sans-serif': ['Arial'],
    'ui-monospace': ['Courier New'],
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
  assets: {
    prefix: '/_fonts',
  },
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
