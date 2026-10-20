import type { Declaration, Value } from 'css-tree'
import type { FontFaceData } from 'unifont'
import { parse } from 'css-tree'

const weightMap: Record<string, string> = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
}

const styleMap: Record<string, string> = {
  italic: 'Italic',
  oblique: 'Oblique',
  normal: '',
}

// https://developer.mozilla.org/en-US/docs/Web/CSS/font-family
/* A generic family name only */
const _genericCSSFamilies = [
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'emoji',
  'math',
  'fangsong',
] as const
export type GenericCSSFamily = typeof _genericCSSFamilies[number]
const genericCSSFamilies = new Set(_genericCSSFamilies)

/* Families that ship with an operating system. Names a provider serves, such as `Roboto`, must stay out. */
const systemFontFamilies = new Set([
  '-apple-system',
  'apple color emoji',
  'blinkmacsystemfont',
  'cambria',
  'consolas',
  'courier',
  'courier new',
  'georgia',
  'helvetica',
  'helvetica neue',
  'liberation mono',
  'liberation sans',
  'liberation serif',
  'lucida console',
  'lucida grande',
  'menlo',
  'monaco',
  'noto color emoji',
  'segoe ui',
  'segoe ui emoji',
  'segoe ui symbol',
  'sf mono',
  'sfmono-regular',
  'tahoma',
  'times',
  'times new roman',
  'verdana',
])

export function isSystemFontFamily(fontFamily: string): boolean {
  return systemFontFamilies.has(fontFamily.toLowerCase())
}

/* Global values */
const globalCSSValues = new Set([
  'inherit',
  'initial',
  'revert',
  'revert-layer',
  'unset',
])

function isFamilyName(name: string) {
  return !genericCSSFamilies.has(name as GenericCSSFamily) && !globalCSSValues.has(name)
}

function parseValue(node: Declaration): Value {
  if (node.value.type !== 'Raw')
    return node.value
  return parse(node.value.value, { context: 'value', positions: true, offset: node.value.loc?.start.offset }) as Value
}

export function extractGeneric(node: Declaration): GenericCSSFamily | undefined {
  for (const child of parseValue(node).children) {
    if (child.type === 'Identifier' && genericCSSFamilies.has(child.name as GenericCSSFamily)) {
      return child.name as GenericCSSFamily
    }
  }
}

export function extractEndOfFirstFamily(node: Declaration): number | undefined {
  const value = parseValue(node)
  let hasFamily = false
  for (const child of value.children) {
    if (child.type === 'String') {
      return child.loc!.end.offset!
    }
    if (child.type === 'Identifier' && isFamilyName(child.name)) {
      hasFamily = true
    }
    if (hasFamily && child.type === 'Operator' && child.value === ',') {
      return child.loc!.start.offset!
    }
  }
  return value.children.last!.loc!.end.offset!
}

export function extractFontFamilies(node: Declaration): string[] {
  const families = [] as string[]
  // Use buffer strategy to handle unquoted 'minified' font-family names
  let buffer = ''
  for (const child of parseValue(node).children) {
    if (child.type === 'Identifier' && isFamilyName(child.name)) {
      buffer = buffer ? `${buffer} ${child.name}` : child.name
    }
    if (buffer && child.type === 'Operator' && child.value === ',') {
      families.push(buffer.replace(/\\/g, ''))
      buffer = ''
    }
    if (buffer && child.type === 'Dimension') {
      buffer = (`${buffer} ${child.value}${child.unit}`).trim()
    }
    if (child.type === 'String') {
      families.push(child.value)
    }
  }

  if (buffer) {
    families.push(buffer)
  }

  return families
}

export function addLocalFallbacks(fontFamily: string, data: FontFaceData[]): FontFaceData[] {
  for (const face of data) {
    const style = (face.style ? styleMap[face.style] : '') ?? ''

    if (Array.isArray(face.weight)) {
      face.src.unshift(({ name: ([fontFamily, 'Variable', style].join(' ')).trim() }))
    }
    else if (face.src[0] && !('name' in face.src[0])) {
      const weights = [face.weight]
        .map(weight => weightMap[weight!])
        .filter(Boolean)

      for (const weight of weights) {
        if (weight === 'Regular') {
          face.src.unshift({ name: ([fontFamily, style].join(' ')).trim() })
        }
        face.src.unshift({ name: ([fontFamily, weight, style].join(' ')).trim() })
      }
    }
  }
  return data
}
