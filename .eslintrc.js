module.exports = {
  root: true,
  'plugins': [
    'jsdoc'
  ],
  extends: [
    'eslint-config-fw'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'quotes': [2, 'single', { 'avoidEscape': true }],
    'indent': ['error', 2],
    'semi': [2, 'always'],
    'no-var': ['error']
  }
};
