#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { FontaineTransform, type FontaineTransformOptions } from './transform'

export interface FontaineCliOptions extends Partial<FontaineTransformOptions> {
  input: string
  output?: string
}

export async function transformCssFile({ input, output, ...options }: FontaineCliOptions): Promise<string> {
  const inputPath = resolve(input)
  const source = readFileSync(inputPath, 'utf8')
  const plugin = FontaineTransform.rollup({
    fallbacks: ['Arial'],
    ...options,
    resolvePath: options.resolvePath || (id => pathToFileURL(resolve(dirname(inputPath), id)).toString()),
  })
  const transformPlugin = Array.isArray(plugin) ? plugin[0]! : plugin
  const transform = transformPlugin.transform
  if (!transform || typeof transform === 'string' || typeof transform === 'function')
    throw new Error('Fontaine transform hook is unavailable')

  const transformed = await transform.handler.call({} as any, source, inputPath)
  const code = typeof transformed === 'string' ? transformed : transformed?.code || source
  const outputPath = output ? resolve(output) : inputPath.replace(/\.css$/, '.fontaine.css')

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, code)
  return outputPath
}

function printHelp() {
  console.log(`Usage: fontaine <input.css> [output.css]

Transforms a CSS file and writes fallback font-face rules using fontaine.

Arguments:
  input.css    CSS file to transform
  output.css   Output path. Defaults to <input>.fontaine.css
`)
}

async function main() {
  const [, , ...args] = process.argv

  if (args.includes('-h') || args.includes('--help')) {
    printHelp()
    return
  }

  const [input, output] = args

  if (!input) {
    printHelp()
    process.exitCode = 1
    return
  }

  if (!existsSync(input)) {
    console.error(`Input file not found: ${input}`)
    process.exitCode = 1
    return
  }

  const outputPath = await transformCssFile({ input, output })
  console.log(`Generated ${basename(outputPath)}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
