# fontaine

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![Codecov][codecov-src]][codecov-href]

> Automatic font fallback based on font metrics

- [✨ &nbsp;Changelog](https://github.com/unjs/fontaine/blob/main/CHANGELOG.md)
- [▶️ &nbsp;Online playground](https://stackblitz.com/github/unjs/fontaine/tree/main/playground)

## Features

- 💪 Reduces CLS by using local font fallbacks with crafted font metrics.
- ✨ Generates font metrics and overrides automatically.
- ⚡️ Pure CSS, zero runtime overhead.

On the playground project, enabling/disabling `fontaine` makes the following difference rendering `/`, with no customisation required:

|             | Before | After   |
| ----------- | ------ | ------- |
| CLS         | `0.24` | `0.054` |
| Performance | `92`   | `100`   |

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
import { FontaineTransform } from 'fontaine'

// Astro config - astro.config.mjs
import { defineConfig } from 'astro/config'

const options = {
  fallbacks: ['BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'Noto Sans'],
  // You may need to resolve assets like `/fonts/Roboto.woff2` to a particular directory
  resolvePath: id => `file:///path/to/public/dir${id}`,
  // overrideName: (originalName) => `${name} override`
  // sourcemap: false
  // skipFontFaceGeneration: (fallbackName) => fallbackName === 'Roboto override'
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

// Docusaurus plugin - to be provided to the plugins option of docusaurus.config.js
// n.b. you'll likely need to require fontaine rather than importing it
const fontaine = require('fontaine')

function fontainePlugin(_context, _options) {
  return {
    name: 'fontaine-plugin',
    configureWebpack(_config, _isServer) {
      return {
        plugins: [
          fontaine.FontaineTransform.webpack(options),
        ],
      }
    },
  }
}

// Gatsby config - gatsby-node.js
const { FontaineTransform } = require('fontaine')

exports.onCreateWebpackConfig = ({ stage, actions, getConfig }) => {
  const config = getConfig()
  config.plugins.push(FontaineTransform.webpack(options))
  actions.replaceWebpackConfig(config)
}

export default defineConfig({
  integrations: [],
  vite: {
    plugins: [
      FontaineTransform.vite({
        fallbacks: ['Arial'],
        resolvePath: id => new URL(`./public${id}`, import.meta.url), // id is the font src value in the CSS
      }),
    ],
  },
})
```

> **Note**
> If you are using Nuxt, check out [nuxt-font-metrics](https://github.com/danielroe/nuxt-font-metrics) which uses `fontaine` under the hood.

If your custom font is used through the mechanism of CSS variables, you'll need to make a tweak to your CSS variables to give fontaine a helping hand. Docusaurus is an example of this, it uses the `--ifm-font-family-base` variable to reference a custom font. In order that fontaine can connect the variable with the font, we need to add a `{Name of Font} override` suffix to that variable. What does this look like? Well imagine we were using the custom font Poppins which is referenced from the `--ifm-font-family-base` variable, we'd make the following adjustment:

```diff
:root {
  /* ... */
-  --ifm-font-family-base: 'Poppins';
+  --ifm-font-family-base: 'Poppins', 'Poppins override';
```

Behind the scenes, there is a 'Poppins override' `@font-face` rule that has been created by fontaine. By manually adding this override font family to our CSS variable, we make our site use the fallback `@font-face` rule with the correct font metrics that fontaine generates.

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
/* This additional font-face declaration will be added to your CSS. */
@font-face {
  font-family: 'Roboto override';
  src: local('BlinkMacSystemFont'), local('Segoe UI'), local('Helvetica Neue'),
      local('Arial'), local('Noto Sans');
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
- suggestion and algorithm from [Katie Hempenius](https://katiehempenius.com/) & [Kara Erickson](https://github.com/kara) on the Google Aurora team - see [notes on calculating font metric overrides](https://docs.google.com/document/d/e/2PACX-1vRsazeNirATC7lIj2aErSHpK26hZ6dA9GsQ069GEbq5fyzXEhXbvByoftSfhG82aJXmrQ_sJCPBqcx_/pub)
- package name suggestion from [**@clemcode**](https://github.com/clemcode)

## License

Made with ❤️

Published under [MIT License](./LICENCE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/fontaine?style=flat-square
[npm-version-href]: https://npmjs.com/package/fontaine
[npm-downloads-src]: https://img.shields.io/npm/dm/fontaine?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/fontaine
[github-actions-src]: https://img.shields.io/github/workflow/status/unjs/fontaine/ci/main?style=flat-square
[github-actions-href]: https://github.com/unjs/fontaine/actions?query=workflow%3Aci
[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/fontaine/main?style=flat-square
[codecov-href]: https://codecov.io/gh/unjs/fontaine
