---
title: Home
navigation: false
---

::hero
---
announcement:
  title: 'Release v0.0.2'
  icon: 'lucide:party-popper'
  to: https://www.npmjs.com/package/fontless
actions:
  - name: Get Started
    to: /#usage
  - name: GitHub
    variant: outline
    to: https://github.com/unjs/fontaine/tree/main/packages/fontless
    leftIcon: 'lucide:github'
---

#title
Welcome to fontless

#description
Magical Font Optimization for Modern Web Apps <br />
Effortlessly optimize web fonts with fontless. Zero-runtime CSS solution for Google Fonts, Bunny Fonts, and more. Reduce CLS and boost performance.
::

## Features

*   **🚀 Optimized font loading:** Automatically loads and configures fonts with proper fallbacks.
*   **🔤 Multiple provider support:** Google Fonts, Bunny Fonts, FontShare, FontSource, and more using unifont.
*   **📦 Zero runtime overhead:** Pure CSS solution with no JavaScript required at runtime.
*   **📏 Metric-based fallbacks:** Reduces Cumulative Layout Shift (CLS) by using font metrics from [fontaine](https://github.com/nuxtlabs/fontaine).
*   **🔄 CSS transformation:** Detects `font-family` usage in your CSS and injects optimized `@font-face` declarations.
*   **🎯 Framework agnostic:** Works with all modern frameworks (Vue, React, Solid, Svelte, Qwik, etc.).

## Installation

```bash
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

Simply use fonts in your CSS as you normally would, and `fontless` will handle optimization:

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

You can customize `fontless` with various options:

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
    fallbacks: {
      'sans-serif': ['Arial', 'Helvetica Neue']
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
    prefix: '/_fonts'
  },

  // Experimental features
  experimental: {
    disableLocalFallbacks: false
  }
})
```

## How It Works

`Fontless` works by:

*   Scanning your CSS files for `font-family` declarations.
*   Resolving fonts through various providers (Google, Bunny, etc.).
*   Generating optimized `@font-face` declarations with proper metrics.
*   Adding fallback fonts with correct metric overrides to reduce CLS.
*   Automatically downloading and managing font assets.

## 💻 Development

1.  Clone this repository
2.  Enable Corepack using `corepack enable`
3.  Install dependencies using `pnpm install`
4.  Run interactive tests using `pnpm dev`

## License

Made with ❤️

Published under [MIT License](LICENSE).
