const nx = require('@nx/eslint-plugin');
const angularPlugin = require('@angular-eslint/eslint-plugin');
const angularTemplatePlugin = require('@angular-eslint/eslint-plugin-template');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const securityPlugin = require('eslint-plugin-security');

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

  // Security Configuration
  {
    files: ['**/*.ts'],
    plugins: ['security'],
    rules: {
      // Security rules to detect hardcoded secrets
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'error',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',
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
