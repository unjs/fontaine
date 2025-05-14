import type { Declaration } from 'css-tree'
import type { FontFaceData } from 'unifont'

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

function processRawValue(value: string) {
  return value.split(',').map(v => v.trim().replace(/^(?<quote>['"])(.*)\k<quote>$/, '$2'))
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

/* Global values */
const globalCSSValues = new Set([
  'inherit',
  'initial',
  'revert',
  'revert-layer',
  'unset',
])

export function extractGeneric(node: Declaration) {
  if (node.value.type == 'Raw') {
    return
  }

  for (const child of node.value.children) {
    if (child.type === 'Identifier' && genericCSSFamilies.has(child.name as GenericCSSFamily)) {
      return child.name as GenericCSSFamily
    }
  }
}

export function extractEndOfFirstChild(node: Declaration) {
  if (node.value.type == 'Raw') {
    return
  }
  for (const child of node.value.children) {
    if (child.type === 'String') {
      return child.loc!.end.offset!
    }
    if (child.type === 'Operator' && child.value === ',') {
      return child.loc!.start.offset!
    }
  }
  return node.value.children.last!.loc!.end.offset!
}

export function extractFontFamilies(node: Declaration) {
  if (node.value.type == 'Raw') {
    return processRawValue(node.value.value)
  }

  const families = [] as string[]
  // Use buffer strategy to handle unquoted 'minified' font-family names
  let buffer = ''
  for (const child of node.value.children) {
    if (child.type === 'Identifier' && !genericCSSFamilies.has(child.name as GenericCSSFamily) && !globalCSSValues.has(child.name)) {
      buffer = buffer ? `${buffer} ${child.name}` : child.name
    }
    if (buffer && child.type === 'Operator' && child.value === ',') {
      families.push(buffer.replace(/\\/g, ''))
      buffer = ''
    }
    if (buffer && child.type === 'Dimension') {
      buffer = (buffer + ' ' + child.value + child.unit).trim()
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

export function addLocalFallbacks(fontFamily: string, data: FontFaceData[]) {
  for (const face of data) {
    const style = (face.style ? styleMap[face.style] : '') ?? ''

    if (Array.isArray(face.weight)) {
      face.src.unshift(({ name: ([fontFamily, 'Variable', style].join(' ')).trim() }))
    }
    else if (face.src[0] && !('name' in face.src[0])) {
      const weights = (Array.isArray(face.weight) ? face.weight : [face.weight])
        .map(weight => weightMap[weight])
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
