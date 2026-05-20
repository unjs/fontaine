import antfu from '@antfu/eslint-config'

export default antfu()
  .append({
    ignores: ['README.md', 'packages/*/README.md'],
  })
  .append({
    files: ['packages/fontless/examples/**'],
    rules: {
      'unused-imports/no-unused-vars': 'off',
    },
  })
  .append({
    files: ['**/service-worker.ts'],
    rules: {
      'ts/no-use-before-define': 'off',
    },
  })
  .append({
    ignores: [
      'packages/fontless/examples/**/*',
      'packages/fontless/docs/**/*.md',
    ],
  })
  .append({
    rules: {
      'pnpm/yaml-enforce-settings': 'off',
    },
  })
// TSDoc enforcement for API discoverability
{
  plugins: {
    tsdoc: require('eslint-plugin-tsdoc'),
  },
  rules: {
    'tsdoc/syntax': 'error',
  },
}
