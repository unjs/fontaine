#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'node:fs/promises'
import { resolve } from 'pathe'
import { FontaineTransform } from './transform'

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: fontaine <input.css or url> [options]

Options:
  --fallbacks <fonts>   Comma-separated list of fallback fonts (e.g., "BlinkMacSystemFont, Segoe UI")
  --sourcemap           Generate source map
  --overrides-only      Output only the generated @font-face overrides instead of the full transformed CSS
  -h, --help            Show this help message
    `)
    process.exit(0)
  }

  const inputPath = args[0]
  if (!inputPath || inputPath.startsWith('-')) {
    console.error('Error: Please provide an input file or URL.')
    process.exit(1)
  }

  let fallbacks = ['BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
  
  const fallbacksIndex = args.indexOf('--fallbacks')
  if (fallbacksIndex !== -1 && args[fallbacksIndex + 1]) {
    fallbacks = args[fallbacksIndex + 1]!.split(',').map(f => f.trim())
  }

  const sourcemap = args.includes('--sourcemap')
  const overridesOnly = args.includes('--overrides-only')

  try {
    let code = ''
    let resolvedPath = ''

    if (inputPath.startsWith('http://') || inputPath.startsWith('https://')) {
      const res = await fetch(inputPath)
      if (!res.ok) throw new Error(`Failed to fetch ${inputPath}: ${res.statusText}`)
      code = await res.text()
      resolvedPath = inputPath
    } else {
      resolvedPath = resolve(process.cwd(), inputPath)
      code = await fs.readFile(resolvedPath, 'utf8')
    }

    const cssContext = { value: '' }

    const transform = FontaineTransform.raw({
      fallbacks,
      css: cssContext,
      sourcemap,
      resolvePath: id => {
        if (inputPath.startsWith('http://') || inputPath.startsWith('https://')) {
          return new URL(id, inputPath).href
        }
        return id
      }
    }, {} as any)

    const transformHandler = typeof transform.transform === 'function' 
      ? transform.transform 
      : (transform.transform as any)?.handler

    if (typeof transformHandler !== 'function') {
        throw new Error('Failed to load transform handler')
    }

    const result = await transformHandler.call({} as any, code, resolvedPath)

    if (overridesOnly) {
      console.log(cssContext.value)
      return
    }

    if (result && typeof result === 'object' && 'code' in result) {
      console.log(result.code)
    } else if (typeof result === 'string') {
      console.log(result)
    } else {
      console.log(code)
    }
  } catch (error: any) {
    console.error('Error processing file:', error.message)
    process.exit(1)
  }
}

main()
