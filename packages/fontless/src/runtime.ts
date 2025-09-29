/** the runtime value is generated via plugin */
export const preloads: LinkAttributes[] = []

export interface LinkAttributes {
  rel: string
  as: string
  href: string
  crossorigin: 'anonymous' | 'use-credentials' | '' | undefined
}
