import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: 'node16',
  rollup: {
    dts: { respectExternal: false },
  },
  entries: [
    'src/index.ts',
    'src/runtime.ts',
  ],
  externals: ['vite'],
})
