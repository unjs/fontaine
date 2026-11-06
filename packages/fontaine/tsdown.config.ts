import type { TsdownPlugin } from 'tsdown'
import fs from 'node:fs'
import { MagicRegExpTransformPlugin } from 'magic-regexp/transform'
import { defineConfig } from 'tsdown'

/**
 * The plugin parses with `this.parse(code)`, which rolldown defaults to `lang: 'js'`, so
 * TypeScript sources fail to parse. Supply the language the source is actually written in.
 */
function magicRegExpPlugin() {
  const { transform, ...plugin } = MagicRegExpTransformPlugin.rolldown() as TsdownPlugin & {
    transform: { filter: unknown, handler: (this: unknown, code: string, id: string) => unknown }
  }
  return {
    ...plugin,
    transform: {
      filter: transform.filter,
      handler(this: any, code: string, id: string) {
        const context = { ...this, parse: (code: string, options?: object) => this.parse(code, { lang: 'ts', ...options }) }
        return transform.handler.call(context, code, id)
      },
    },
  } as TsdownPlugin
}

export default defineConfig({
  entry: ['src/index.ts', 'src/postcss.ts'],
  format: ['es', 'cjs'],
  plugins: [magicRegExpPlugin()],
  dts: {
    generator: 'oxc',
  },
  hooks: {
    'build:done': async function () {
      const { entireMetricsCollection } = await import('@capsizecss/metrics/entireMetricsCollection')
      // Keep only the fields `getMetricsForFamily` reads.
      const fields = ['ascent', 'descent', 'lineGap', 'unitsPerEm', 'xWidthAvg', 'category', 'fullName', 'postscriptName'] as const
      const metrics = Object.fromEntries(Object.entries(entireMetricsCollection).map(([name, font]) => [
        name,
        Object.fromEntries(fields.map(field => [field, font[field as keyof typeof font]])),
      ]))
      const output = `export const entireMetricsCollection = ${JSON.stringify(metrics)}`
      fs.writeFileSync('dist/capsize-font-metrics.mjs', output)
      fs.writeFileSync('dist/capsize-font-metrics.d.mts', `declare export const entireMetricsCollection: typeof import('@capsizecss/metrics/entireMetricsCollection').entireMetricsCollection`)
    },
  },
}) as any
