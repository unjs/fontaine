import fs from 'node:fs'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  hooks: {
    'build:done': async function () {
      const { entireMetricsCollection } = await import('@capsizecss/metrics/entireMetricsCollection')
      const output = `export const entireMetricsCollection = ${JSON.stringify(entireMetricsCollection)}`
      fs.writeFileSync('dist/capsize-font-metrics.mjs', output)
    },
  },
})
