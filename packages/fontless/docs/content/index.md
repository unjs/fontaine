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

::card-group{cols=3}
  ::card
  ---
  title: Optimized font loading
  icon: lucide:rocket
  ---
  Automatically loads and configures fonts with proper fallbacks.
  ::

  ::card
  ---
  title: Multiple provider support
  icon: lucide:file-stack
  ---
  Google Fonts, Bunny Fonts, FontShare, FontSource, npm packages, and more using unifont.
  ::

  ::card
  ---
  title: Zero runtime overhead
  icon: lucide:box
  ---
  Pure CSS solution with no JavaScript required at runtime.
  ::

  ::card
  ---
  title: Metric-based fallbacks
  icon: lucide:ruler
  ---
  Reduces Cumulative Layout Shift (CLS) by using font metrics from [fontaine](https://github.com/nuxtlabs/fontaine).
  ::

  ::card
  ---
  title: CSS transformation
  icon: lucide:repeat
  ---
  Detects `font-family` usage in your CSS and injects optimized `@font-face` declarations.
  ::

  ::card
  ---
  title: Framework agnostic
  icon: lucide:target
  ---
  Works with all modern frameworks (Vue, React, Solid, Svelte, Qwik, etc.).
  :: 
::

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
    npm: true,             // npm packages (@fontsource/*, etc.)
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
    // Ship only the glyphs this family needs
    {
      name: 'Cabinet Grotesk',
      glyphs: 'Handgloves & 0123'
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

  // Route provider API requests through a `unifont` proxy, for environments that cannot
  // reach the provider APIs directly. Defaults to `https://proxy.unifont.dev` in browsers
  // and StackBlitz web containers, and to no proxy elsewhere. Pass `false` to disable.
  apiBase: 'https://proxy.unifont.dev',

  // Experimental features
  experimental: {
    disableLocalFallbacks: false
  }
})
```

## Glyph Subsetting

If a family only ever renders a fixed set of characters, set `glyphs` on it (or on `defaults`, for every family) and `fontless` will reduce every file it emits for that family to those glyphs.

The subsetter is an optional peer dependency, so install it alongside `fontless` if you use this option:

```bash
pnpm add -D subset-font
```

```js
fontless({
  families: [
    // a string of text...
    { name: 'Cabinet Grotesk', glyphs: 'Handgloves & 0123' },
    // ...or an explicit list of characters
    { name: 'Erode', glyphs: ['H', 'a', 'n', 'd'] },
  ],
})
```

Subsetting runs on the font file itself with [harfbuzz](https://harfbuzz.github.io/) (via [`subset-font`](https://github.com/papandreou/subset-font)), so it works for fonts from every provider as well as local files, keeps the original format and keeps a variable font's axes. Where the provider can subset server-side (Google Fonts' `text=` API) the glyph list is passed through to it as well, so the full file is never downloaded.

The glyph list is part of the emitted file's name, so two families sharing a source font with different glyph lists get their own file, and changing the list invalidates the cache. Fallback metrics are still read from the original font, so `size-adjust` and friends are unaffected.

**Check the font's licence first.** Subsetting modifies the file you ship, and some licences (particularly commercial and free-with-conditions ones) restrict modifying, converting or self-hosting a font.

## npm Provider

The `npm` provider resolves fonts from locally installed npm packages such as [`@fontsource/*`](https://fontsource.org/), [`@fontsource-variable/*`](https://fontsource.org/), and [`cal-sans`](https://github.com/calcom/font). It is enabled by default with `remote: false`, meaning it only reads from your local `node_modules` without making any network requests.

### Basic usage

Install a font package and use it in your CSS:

```bash
pnpm install @fontsource/inter
```

```css
.my-text {
  font-family: "Inter", sans-serif;
}
```

The npm provider will automatically detect the installed `@fontsource/inter` package and resolve the font from `node_modules`.

### Configuration

```js
fontless({
  // npm provider options
  npm: {
    // Only resolve from local node_modules (default: false)
    remote: false,
    // Enable CDN fallback when local resolution fails
    // remote: true,
  },
})
```

You can also specify npm-specific options per font family:

```js
fontless({
  families: [
    {
      name: 'Inter',
      provider: 'npm',
      providerOptions: {
        npm: {
          package: '@fontsource/inter',
          file: 'index.css',
        },
      },
    },
  ],
})
```

## Global Font Faces

Some fonts are never referenced from CSS that Fontless can see, so there is no usage site to inject their `@font-face` at: a family used only from inline styles, from a canvas, or from a third-party widget. Mark those families `global` and their `@font-face` is emitted regardless of usage.

```js
fontless({
  families: [
    { name: 'Inter', global: true },
  ],
})
```

For Vite SPA the declarations are inlined into a `<style>` tag in `<head>`, rather than linked as a stylesheet, so the browser learns about the family without waiting for another request. Unlike preloads, this works on the first `vite dev` render, as global families are resolved from your config rather than discovered from stylesheets.

Any usage of the family that *does* appear in CSS still gains the metric-override fallback families, so `global` does not cost you the layout-shift protection.

For SSR meta-frameworks, `fontless/runtime` exposes the same declarations as a string:

```ts
import { globalFontFaces } from 'fontless/runtime'
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
