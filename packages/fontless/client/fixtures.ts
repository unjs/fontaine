import type { ManualFontDetails, ProviderFontDetails } from '../src/types'
import { fileURLToPath } from 'node:url'

const LATIN = ['U+0000-00FF', 'U+0131', 'U+0152-0153', 'U+02BB-02BC', 'U+02C6', 'U+02DA', 'U+02DC', 'U+0304', 'U+0308', 'U+0329', 'U+2000-206F', 'U+20AC', 'U+2122', 'U+2191', 'U+2193', 'U+2212', 'U+2215', 'U+FEFF', 'U+FFFD']

function google(family: string, style: string, weight: number, url: string): ProviderFontDetails['fonts'][number] {
  return {
    src: [{ name: family }, { url, originalURL: url, format: 'woff2' }],
    style,
    weight,
    unicodeRange: LATIN,
  }
}

const blackFox = fileURLToPath(new URL('../examples/vanilla-app/src/black-fox.ttf', import.meta.url))

export function createFixtures(base: string): Array<ManualFontDetails | ProviderFontDetails> {
  return [
    {
      type: 'auto',
      fontFamily: 'Poppins',
      provider: 'google',
      fonts: [
        google('Poppins', 'normal', 400, 'https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2'),
        google('Poppins', 'italic', 400, 'https://fonts.gstatic.com/s/poppins/v24/pxiGyp8kv8JHgFVrJJLucHtAOvWDSA.woff2'),
        google('Poppins', 'normal', 700, 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2'),
      ],
    },
    {
      type: 'override',
      fontFamily: 'Fira Code',
      provider: 'google',
      fonts: [
        google('Fira Code', 'normal', 400, 'https://fonts.gstatic.com/s/firacode/v27/uU9eCBsR6Z2vfE9aq3bL0fxyUs4tcw4W_D1sJVD7NuzlojwUKQ.woff2'),
      ],
    },
    {
      type: 'manual',
      fontFamily: 'Black Fox',
      fonts: [
        { src: [{ name: 'Black Fox' }, { url: `${base}@fs${blackFox}`, format: 'truetype' }], weight: 400 },
      ],
    },
  ]
}
