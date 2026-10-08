import { describe, expect, it } from 'vitest'
import { isFetchableURL, joinURL } from '../src/url'

describe('isFetchableURL', () => {
  it('should accept http, https, file and data URLs', () => {
    expect(isFetchableURL('https://example.com/font.woff2')).toBe(true)
    expect(isFetchableURL('http://example.com/font.woff2')).toBe(true)
    expect(isFetchableURL('file:///fonts/font.woff2')).toBe(true)
    expect(isFetchableURL('data:font/woff2;base64,AAAA')).toBe(true)
  })

  it('should parse URLs the same way `fetch` does', () => {
    expect(isFetchableURL(' https://example.com/font.woff2')).toBe(true)
    expect(isFetchableURL('HTTPS://example.com/font.woff2')).toBe(true)
    expect(isFetchableURL('https:\\\\example.com\\font.woff2')).toBe(true)
  })

  it('should reject other protocols', () => {
    expect(isFetchableURL('javascript:alert(1)')).toBe(false)
    expect(isFetchableURL('blob:https://example.com/0000')).toBe(false)
    expect(isFetchableURL('ftp://example.com/font.woff2')).toBe(false)
    expect(isFetchableURL('C:/fonts/font.woff2')).toBe(false)
  })

  it('should reject paths, font names and malformed URLs', () => {
    expect(isFetchableURL('/fonts/font.woff2')).toBe(false)
    expect(isFetchableURL('./fonts/font.woff2')).toBe(false)
    expect(isFetchableURL('Inter')).toBe(false)
    expect(isFetchableURL('http:')).toBe(false)
  })

  it('should only accept protocol-relative URLs when asked to', () => {
    expect(isFetchableURL('//example.com/font.woff2')).toBe(false)
    expect(isFetchableURL('//example.com/font.woff2', true)).toBe(true)
    expect(isFetchableURL('// not a host', true)).toBe(false)
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
