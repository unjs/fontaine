# fontless

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![Codecov][codecov-src]][codecov-href]

> Magical plug-and-play font optimization for modern web applications

## Features

- 🚀 **Optimized font loading**: Automatically loads and configures fonts with proper fallbacks and preload links.
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
    preload: true, // also accepts { subsets: ['latin'] } or a filter function
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
    prefix: '/assets/_fonts'
  },

  // Where font metadata and downloaded fonts are cached between builds, defaulting to
  // `node_modules/.cache/fontless/meta`. Accepts a directory (resolved from the Vite
  // root), `{ dir }`, an `unstorage` instance for a custom driver, or `false` to
  // disable persistent caching.
  cache: '.cache/fonts',

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

## Glyph Subsetting

If you know a family only ever renders a fixed set of characters — a logotype, a specimen, a set of headings — set `glyphs` on it and `fontless` will reduce every file it emits for that family to those glyphs, whichever provider served it.

The subsetter is an optional peer dependency, so install it alongside `fontless` if you use this option:

```bash
pnpm add -D subset-font
```

```ts
fontless({
  // apply to every family
  defaults: { glyphs: 'Handgloves & 0123' },
  families: [
    // a string of text...
    { name: 'Cabinet Grotesk', glyphs: 'Handgloves & 0123' },
    // ...or an explicit list of characters
    { name: 'Erode', glyphs: ['H', 'a', 'n', 'd'] },
  ],
})
```

Subsetting happens on the font file itself with [harfbuzz](https://harfbuzz.github.io/) (via [`subset-font`](https://github.com/papandreou/subset-font)), so it works for fonts from every provider as well as local files, keeps the original format and keeps a variable font's axes. Where the provider can subset server-side (Google Fonts' `text=` API) the glyph list is passed through to it as well, so the full file is never downloaded.

The glyph list is part of the emitted file's name, so two families sharing a source font with different glyph lists get their own file, and changing the list invalidates the cache. Fallback metrics are still read from the original font, so `size-adjust` and friends are unaffected. Files are emitted unchanged for families without `glyphs`.

> [!IMPORTANT]
> Subsetting modifies the font file you ship. Some licences (particularly commercial and free-with-conditions ones) restrict modifying, converting or self-hosting a font, so check the licence or terms of the font you are subsetting before enabling this.

## Preloading Fonts

Preloading is opt-in: no font is preloaded unless you ask for it. Enable it for every family with `defaults.preload`, or for individual families with `families[].preload`:

```ts
fontless({
  // preload the highest-priority font face of every family
  defaults: { preload: true },
  // ...or configure specific families
  families: [
    { name: 'Poppins', preload: true },
    // preload every face covering a given subset
    { name: 'Inter', preload: { subsets: ['latin'] } },
    // or filter faces individually
    { name: 'Roboto', preload: (family, font) => font.style === 'normal' },
  ],
})
```

For Vite SPA, the selected preload fonts are injected into the HTML, apart from the first `vite dev` render, where the stylesheets have not been transformed yet.

For SSR meta-frameworks which don't rely on [`transformIndexHtml` plugin hook](https://vite.dev/guide/api-plugin.html#transformindexhtml), you need to manually render preload links on the server. Fontless provides `fontless/runtime` module for server to access the necessary data for preload links generation, for example:

- Vanilla

```tsx
import { preloads } from "fontless/runtime";

function renderHtml() {
  const renderedPreloads = preloads
    .map(
      (attrs) =>
        `<link rel="${attrs.rel}" as="${attrs.as}" href="${attrs.href}" crossorigin="${attrs.crossorigin}">`,
    )
    .join("\n");
  return `\
<html>
  <head>
    ${renderedPreloads}
  </head>
  <body>
    ...
  </body>
</html>
`;
}
```

- [Qwik](./examples/qwik-app)

```tsx
import { preloads } from "fontless/runtime"

export const RouterHead = component$(() => {
  return (
    <>
      {preloads.map((l) => (
        <link key={l.href} {...l} />
      ))}
      ...
    </>
  )
})
```

- [React](./examples/react-router-app)

```tsx
import { preloads } from 'fontless/runtime'

function Layout() {
  return (
    <html lang="en">
      <head>
        {preloads.map(({crossorigin, ...attrs}) => (
          <link
            key={attrs.href}
            {...attrs}
            crossOrigin={crossorigin}
          />
        ))}
        ...
      </head>
      <body>
        ...
      </body>
    </html>
  )
}
```

- [SvelteKit](./examples/sveltekit-app)

If `preloads` is an empty array, either no `preload` option is enabled, or a configured subset list or filter function matched no font faces, or `fontless/runtime` was not transformed by the plugin. In the last case, check that `fontless()` is in your Vite config and that `fontless/runtime` is not externalised.

```svelte
<script lang="ts">
	import { preloads } from "fontless/runtime";
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#each preloads as attrs}
		<link {...attrs} />
	{/each}
</svelte:head>
```

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
