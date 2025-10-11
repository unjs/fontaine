# fontless

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![Codecov][codecov-src]][codecov-href]

> Magical plug-and-play font optimization for modern web applications

## Features

- 🚀 **Optimized font loading**: Automatically loads and configures fonts with proper fallbacks
- 🔤 **Multiple provider support**: Google Fonts, Bunny Fonts, FontShare, FontSource, and more using [unifont](https://github.com/unjs/unifont)
- 📦 **Zero runtime overhead**: Pure CSS solution with no JavaScript required at runtime
- 📏 **Metric-based fallbacks**: Reduces Cumulative Layout Shift (CLS) by using font metrics from [fontaine](https://github.com/unjs/fontaine)
- 🔄 **CSS transformation**: Detects font-family usage in your CSS and injects optimized `@font-face` declarations
- 🎯 **Framework agnostic**: Works with all modern frameworks (Vue, React, Solid, Svelte, Qwik, etc.)

## Installation

```sh
# npm
npm install fontless

# pnpm
pnpm install fontless
```

## Usage

Add the `fontless` plugin to your Vite configuration:

```js
// vite.config.js / vite.config.ts
import { defineConfig } from 'vite'
import { fontless } from 'fontless'

export default defineConfig({
  plugins: [
    // ... other plugins
    fontless()
  ],
})
```

### Using fonts in your CSS

Simply use fonts in your CSS as you normally would, and fontless will handle optimization:

```css
/* Your CSS */
.google-font {
  font-family: "Poppins", sans-serif;
}

.bunny-font {
  font-family: "Aclonica", sans-serif;
}
```

## Configuration

You can customize fontless with various options:

```js
fontless({
  // Configure available providers
  providers: {
    google: true,          // Google Fonts
    bunny: true,           // Bunny Fonts
    fontshare: true,       // FontShare
    fontsource: true,      // FontSource
    // Disable a provider
    adobe: false
  },

  // Provider priority order
  priority: ['google', 'bunny', 'fontshare'],

  // Default font settings
  defaults: {
    preload: true,
    weights: [400, 700],
    styles: ['normal', 'italic'],
    // Fallbacks use category-aware presets from fontaine
    // Override specific generic families as needed
    fallbacks: {
      'sans-serif': ['Arial', 'Helvetica Neue'],
      // serif, monospace, cursive, fantasy, system-ui, etc. use shared defaults
    }
  },

  // Custom font family configurations
  families: [
    // Configure a specific font
    {
      name: 'Poppins',
      provider: 'google',
      weights: [300, 400, 600]
    },
    // Manual font configuration
    {
      name: 'CustomFont',
      src: [{ url: '/fonts/custom-font.woff2', format: 'woff2' }],
      weight: [400]
    }
  ],

  // Asset configuration
  assets: {
    prefix: '/assets/_fonts'
  },

  // Experimental features
  experimental: {
    disableLocalFallbacks: false
  }
})
```

### Category-Aware Fallbacks

Fontless uses category-aware fallback presets shared with the [fontaine](https://github.com/unjs/fontaine) package. These presets provide optimized system fonts for different generic font families:

- **sans-serif**: `BlinkMacSystemFont`, `Segoe UI`, `Helvetica Neue`, `Arial`, `Noto Sans`
- **serif**: `Times New Roman`, `Georgia`, `Noto Serif`
- **monospace**: `Courier New`, `Roboto Mono`, `Noto Sans Mono`
- **cursive**: Uses handwriting category fallbacks
- **fantasy**: Uses display category fallbacks
- **system-ui**, **ui-serif**, **ui-sans-serif**, **ui-monospace**: Mapped to corresponding category presets

You can override fallbacks for specific generic families in the `defaults.fallbacks` configuration while keeping the shared defaults for others. This ensures consistent font fallback behavior across your application and reduces cumulative layout shift (CLS).

## How It Works

Fontless works by:

1. Scanning your CSS files for font-family declarations
2. Resolving fonts through various providers (Google, Bunny, etc.)
3. Generating optimized `@font-face` declarations with proper metrics
4. Adding fallback fonts with correct metric overrides to reduce CLS
5. Automatically downloading and managing font assets

## 💻 Development

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## License

Made with ❤️

Published under [MIT License](./LICENCE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/fontless?style=flat-square
[npm-version-href]: https://npmjs.com/package/fontless
[npm-downloads-src]: https://img.shields.io/npm/dm/fontless?style=flat-square
[npm-downloads-href]: https://npm.chart.dev/fontless
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/unjs/fontaine/ci.yml?branch=main&style=flat-square
[github-actions-href]: https://github.com/unjs/fontaine/actions/workflows/ci.yml
[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/fontaine/main?style=flat-square
[codecov-href]: https://codecov.io/gh/unjs/fontaine
