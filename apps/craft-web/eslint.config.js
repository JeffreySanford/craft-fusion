const nx = require('@nx/eslint-plugin');
const baseConfig = require('../../eslint.base.config.js');

module.exports = [
  ...baseConfig,
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    extends: [
      'plugin:@angular-eslint/recommended',
      'plugin:@angular-eslint/template/process-inline-templates'
    ],
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
      '@angular-eslint/prefer-standalone': 'off', // Ensures non-standalone mode
      'import/no-cycle': 'error', // Prevent circular dependencies
      '@typescript-eslint/no-unused-vars': 'warn', // Highlight unused variables
    },
  },
  {
    files: ['**/*.html'],
    extends: ['plugin:@angular-eslint/template/recommended'],
    rules: {
      '@angular-eslint/template/no-negated-async': 'warn'
    },
  },
];
