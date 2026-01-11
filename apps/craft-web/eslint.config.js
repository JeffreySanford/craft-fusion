const nx = require('@nx/eslint-plugin');
const angularPlugin = require('@angular-eslint/eslint-plugin');
const angularTemplatePlugin = require('@angular-eslint/eslint-plugin-template');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  ...nx.configs['flat/angular'], // Extends Nx's Angular flat configuration
  ...nx.configs['flat/angular-template'], // Extends Nx's Angular template configuration

  // TypeScript Configuration
  {
    files: ['**/*.ts'],
    plugins: ['@angular-eslint', '@typescript-eslint', 'import'],
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: '../../tsconfig.base.json',
        "tsconfigRootDir": "./",
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
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
      '@typescript-eslint/no-unused-vars': 'warn',
      'import/no-cycle': 'error',
    },
  },

  // Angular Template Configuration
  {
    files: ['**/*.html'],
    plugins: ['@angular-eslint/template'],
    rules: {
      '@angular-eslint/template/no-negated-async': 'warn',
    },
  },
];
