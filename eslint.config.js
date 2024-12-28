const nx = require('@nx/eslint-plugin');
const baseConfig = require('./eslint.base.config.js'); // Corrected path

module.exports = [
  ...baseConfig,
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    extends: ['plugin:@angular-eslint/recommended'],
    "plugins": ["@angular-eslint", "@typescript-eslint"],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: './tsconfig.json',
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-standalone': 'off',
    },
  },
  {
    files: ['**/*.scss'],
    extends: ['stylelint-config-standard-scss', 'stylelint-config-prettier'],
    rules: {
      'at-rule-no-unknown': null,
      'scss/at-rule-no-unknown': true,
    },
  },
  {
    files: ['**/*.html'],
    rules: {},
  },
];
