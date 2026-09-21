import { describe, expect, it, vi } from 'vitest'

// `lightningcss` is an optional peer dependency, so this file simulates a project that has
// not installed it. It lives on its own so the mock cannot leak into the other suites.
vi.mock('lightningcss', () => {
  throw new Error('Cannot find package \'lightningcss\'')
})

describe('renderDeclaration without `lightningcss` installed', () => {
  it('should emit the declaration unminified', async () => {
    const { renderDeclaration } = await import('../src/utils')

    const declaration = '@font-face {\n  font-family: \'Poppins\';\n}'

    expect(await renderDeclaration(declaration, 'style.css', { dev: false })).toBe(declaration)
  })
})
