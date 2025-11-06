import fs from 'node:fs'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['es', 'cjs'],
  dts: {
    oxc: true,
  },
  hooks: {
    'build:done': async function () {
      const { entireMetricsCollection } = await import('@capsizecss/metrics/entireMetricsCollection')
      const output = `export const entireMetricsCollection = ${JSON.stringify(entireMetricsCollection)}`
      fs.writeFileSync('dist/capsize-font-metrics.mjs', output)
      fs.writeFileSync('dist/capsize-font-metrics.d.mts', `declare export const entireMetricsCollection: typeof import('@capsizecss/metrics/entireMetricsCollection').entireMetricsCollection`)
    },
  },
}) as any
