import { describe, expect, it } from 'vitest'
import { hasProtocol, joinURL } from '../src/url'

describe('hasProtocol', () => {
  it('should detect URLs with a protocol', () => {
    expect(hasProtocol('https://example.com/font.woff2')).toBe(true)
    expect(hasProtocol('data:font/woff2;base64,AAAA')).toBe(true)
    expect(hasProtocol('file:///fonts/font.woff2')).toBe(true)
  })

  it('should not treat paths or font names as URLs', () => {
    expect(hasProtocol('/fonts/font.woff2')).toBe(false)
    expect(hasProtocol('./fonts/font.woff2')).toBe(false)
    expect(hasProtocol('Inter')).toBe(false)
    expect(hasProtocol('C:/fonts/font.woff2')).toBe(false)
  })

  it('should only accept protocol-relative URLs when asked to', () => {
    expect(hasProtocol('//example.com/font.woff2')).toBe(false)
    expect(hasProtocol('//example.com/font.woff2', true)).toBe(true)
  })
})

describe('joinURL', () => {
  it('should join segments with a single slash', () => {
    expect(joinURL('/', '/assets/_fonts', 'font.woff2')).toBe('/assets/_fonts/font.woff2')
    expect(joinURL('/build/', '/assets/_fonts/', 'font.woff2')).toBe('/build/assets/_fonts/font.woff2')
    expect(joinURL('https://cdn.example.com', '_fonts', './font.woff2')).toBe('https://cdn.example.com/_fonts/font.woff2')
  })

  it('should skip empty segments', () => {
    expect(joinURL('/', '', '_fonts')).toBe('/_fonts')
    expect(joinURL('/build/', '/')).toBe('/build/')
    expect(joinURL('', '/_fonts')).toBe('/_fonts')
  })
})
