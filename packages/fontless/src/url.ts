const PROTOCOL_RE = /^[\w+.-]{2,}:/

export function hasProtocol(url: string, acceptRelative = false): boolean {
  return PROTOCOL_RE.test(url) || (acceptRelative && url.startsWith('//'))
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
