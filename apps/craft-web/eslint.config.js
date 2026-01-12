const path = require('path');
const nx = require('@nx/eslint-plugin');
const baseConfig = require('../../eslint.base.config.js');
const angularPlugin = require('@angular-eslint/eslint-plugin');
const angularTemplatePlugin = require('@angular-eslint/eslint-plugin-template');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');

const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
  ...baseConfig,
  {
    ignores: ['**/jest.config.ts', '**/eslint.config.js', '**/src/test-setup.ts'],
  },
  ...nx.configs['flat/angular'], // Extends Nx's Angular flat configuration
  ...nx.configs['flat/angular-template'], // Extends Nx's Angular template configuration

  // TypeScript Configuration
  {
    files: ['**/*.ts'],
    plugins: {
      'import': importPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: path.resolve(__dirname, '../../tsconfig.base.json'),
        tsconfigRootDir: __dirname,
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    rules: {
      '@angular-eslint/no-empty-lifecycle-method': 'warn',
      '@angular-eslint/contextual-lifecycle': 'warn',
      '@angular-eslint/directive-selector': [
        'warn',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'warn',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-standalone': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'import/no-cycle': 'warn',
    },
  },

  // Angular Template Configuration
  {
    files: ['**/*.html'],
    rules: {
      '@angular-eslint/template/no-negated-async': 'warn',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
      '@angular-eslint/template/label-has-associated-control': 'warn',
    },
  },
];
