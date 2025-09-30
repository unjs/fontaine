/** the runtime value is generated via plugin */
export const preloads: LinkAttributes[] = []

export interface LinkAttributes {
  rel: 'preload'
  as: 'font'
  href: string
  crossorigin: 'anonymous' | 'use-credentials' | '' | undefined
}
