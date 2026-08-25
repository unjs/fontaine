import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/runtime.ts'],
  // `subset-font` resolves `harfbuzzjs/hb-subset.wasm` with `require.resolve` at runtime,
  // which only works from its own location in `node_modules`
  external: ['subset-font'],
  format: ['esm'],
  dts: {
    oxc: true,
  },
}) as any
