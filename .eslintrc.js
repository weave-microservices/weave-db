module.exports = {
  root: true,
  extends: [
    'eslint-config-fw'
  ],
  rules: {
    'quotes': [2, 'single', { 'avoidEscape': true }],
    'indent': ['error', 2],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  }
};
