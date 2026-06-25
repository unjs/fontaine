import tsdoc from 'eslint-plugin-tsdoc';

export default [
  {
    plugins: {
      tsdoc,
    },
    rules: {
      'tsdoc/syntax': 'error',
    },
  },
];
