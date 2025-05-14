import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: 'node16',
  rollup: {
    dts: { respectExternal: false },
  },
  externals: ['vite'],
})
