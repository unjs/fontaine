import antfu from '@antfu/eslint-config'

export default antfu().append({
  ignores: ['README.md', 'CODE_OF_CONDUCT.md', 'LICENCE'],
})
