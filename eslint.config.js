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
    ],
  })
