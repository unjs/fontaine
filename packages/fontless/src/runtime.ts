/**
 * Font preload link attributes for the current build, for frameworks that render
 * their own `<head>` on the server rather than going through `transformIndexHtml`.
 *
 * The `fontless` Vite plugin replaces this module with the generated list, so an
 * empty array at runtime means the import was resolved without the plugin.
 */
export const preloads: LinkAttributes[] = []

export interface LinkAttributes {
  rel: 'preload'
  as: 'font'
  href: string
  crossorigin: 'anonymous' | 'use-credentials' | '' | undefined
}

// Reaching this module at runtime means the plugin did not replace it, so the import
// resolved to the published stub and no fonts will be preloaded.
console.warn('[fontless] `fontless/runtime` was not transformed by the fontless Vite plugin, so no fonts will be preloaded. Check that `fontless()` is in your Vite config and that `fontless/runtime` is not externalised.')
