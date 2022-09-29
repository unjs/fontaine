# fontaine

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![Codecov][codecov-src]][codecov-href]

> Automatic font fallback based on font metrics

- [✨ &nbsp;Changelog](https://github.com/danielroe/nuxt-font-metrics/blob/main/CHANGELOG.md)
- [▶️ &nbsp;Online playground](https://stackblitz.com/github/danielroe/nuxt-font-metrics/tree/main/playground)

## Features

**⚠️ `fontaine` is under active development. ⚠️**

- 💪 Reduces CLS by using local font fallbacks with crafted font metrics.
- ✨ Generates font metrics and overrides automatically.
- ⚡️ Pure CSS, zero runtime overhead.

On the playground project, enabling/disabling `fontaine` makes the following difference rendering `/`, with no customisation required:

|             | Before | After   |
| ----------- | ------ | ------- |
| CLS         | `0.34` | `0.013` |
| Performance | `88`   | `98`    |

## Installation

With `pnpm`

```bash
pnpm add -D fontaine
```

Or, with `npm`

```bash
npm install -D fontaine
```

Or, with `yarn`

```bash
yarn add -D fontaine
```

## Usage

```js
import { FontaineTransform } from 'foontaine'

const options = {
  fallbacks: ['BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans'],
  // You may need to resolve assets like `/fonts/Roboto.woff2` to a particular directory
  resolvePath: (id) => 'file:///path/to/public/dir' + id,
}

// Vite
export default {
  plugins: [FontaineTransform.vite(options)]
}

// Next.js
export default {
  webpack(config) {
    config.plugins = config.plugins || []
    config.plugins.push(FontaineTransform.webpack(options))
    return config
  },
}
```

## How it works

`fontaine` will scan your `@font-face` rules and generate fallback rules with the correct metrics. For example:

```css
@font-face {
  font-family: 'Roboto';
  font-display: swap;
  src: url('/fonts/Roboto.woff2') format('woff2'), url('/fonts/Roboto.woff')
      format('woff');
  font-weight: 700;
}
/* This will be generated. */
@font-face {
  font-family: 'Roboto override';
  src: local('BlinkMacSystemFont'), local('Segoe UI'), local('Roboto'), local(
      'Helvetica Neue'
    ), local('Arial'), local('Noto Sans');
  ascent-override: 92.7734375%;
  descent-override: 24.4140625%;
  line-gap-override: 0%;
}
```

Then, whenever you use `font-family: 'Roboto'`, `fontaine` will add the override to the font-family:

```css
:root {
  font-family: 'Roboto';
  /* This becomes */
  font-family: 'Roboto', 'Roboto override';
}
```

## 💻 Development

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`; launch a vite server using source code with `pnpm demo:dev`

## Credits

This would not have been possible without:

- amazing tooling and generated metrics from [capsizecss](https://seek-oss.github.io/capsize/)
- suggestion and algorithm from [Katie Hempenius](https://katiehempenius.com/) & [Kara Erickson](https://github.com/kara) on the Google Aurora team - see [notes on calculating font metric overrides](https://docs.google.com/document/d/e/2PACX-1vRsazeNirATC7lIj2aErSHpK26hZ6dA9GsQ069GEbq5fyzXEhXbvByoftSfhG82aJXmrQ_sJCPBqcx_/pub).

## License

Made with ❤️

Published under [MIT License](./LICENCE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/fontaine?style=flat-square
[npm-version-href]: https://npmjs.com/package/fontaine
[npm-downloads-src]: https://img.shields.io/npm/dm/fontaine?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/fontaine
[github-actions-src]: https://img.shields.io/github/workflow/status/danielroe/fontaine/ci/main?style=flat-square
[github-actions-href]: https://github.com/danielroe/fontaine/actions?query=workflow%3Aci
[codecov-src]: https://img.shields.io/codecov/c/gh/danielroe/fontaine/main?style=flat-square
[codecov-href]: https://codecov.io/gh/danielroe/fontaine
