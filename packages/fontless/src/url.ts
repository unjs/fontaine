const FETCHABLE_PROTOCOLS = new Set(['http:', 'https:', 'file:', 'data:'])

export function isFetchableURL(url: string, acceptProtocolRelative = false): boolean {
  const parsed = url.startsWith('//')
    ? acceptProtocolRelative && URL.parse(url, 'https://localhost')
    : URL.parse(url)
  return !!parsed && FETCHABLE_PROTOCOLS.has(parsed.protocol)
}

export function joinURL(base: string, ...segments: string[]): string {
  let url = base
  for (const segment of segments) {
    if (!segment || segment === '/') {
      continue
    }
    url = url
      ? `${url.endsWith('/') ? url : `${url}/`}${segment.replace(/^\.?\//, '')}`
      : segment
  }
  return url
}
