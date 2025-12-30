const { FlatCompat } = require('@eslint/eslintrc');
const baseConfig = require('../../eslint.base.config.js');
const tsParser = require('@typescript-eslint/parser');

const path = require('path');
const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [
  baseConfig,
  ...compat.extends('plugin:nestjs/recommended'),

  {
    // Run on all TS files in the project (tests/config files included) — use a separate typed linting entry for src files
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'nestjs': require('eslint-plugin-nestjs'),
      'rxjs': require('eslint-plugin-rxjs'),
    },
    rules: {
      // NestJS rules are provided by plugin:nestjs/recommended; add project-specific rules here if needed.
      
      // RxJS rules (moved to typed linting below if they require type information)
      // See typed linting block for rules that require parserOptions.project.
      
      // Prefer Observables over Promises and discourage async/await - start as warnings to enable incremental migration
      'no-restricted-syntax': ['warn', 
        {
          selector: 'CallExpression[callee.property.name="toPromise"]',
          message: 'Use Observables instead of converting to Promises with toPromise()'
        },
        {
          selector: 'FunctionDeclaration[async=true]',
          message: 'Avoid async/await. Use Observables instead.'
        },
        {
          selector: 'FunctionExpression[async=true]',
          message: 'Avoid async/await. Use Observables instead.'
        },
        {
          selector: 'ArrowFunctionExpression[async=true]',
          message: 'Avoid async/await. Use Observables instead.'
        }
      ],
      
      // Additional RxJS preferences can be added here if supported by the plugin
      
      
      // Custom rules can be added here if needed (ensure plugins are installed)
    },
  },
  // Typed linting for source files only (requires project parser options)
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: path.resolve(__dirname),
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true, ignoreIIFE: true }],
      // Relax explicit return/module-boundary types to warnings to avoid failing the lint run during gradual rollout
      '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true, allowTypedFunctionExpressions: true }],
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      // RxJS rules requiring type information (enable here where parserOptions.project is present)
      'rxjs/no-async-subscribe': 'error',
      'rxjs/no-ignored-observable': 'error',
      // Disabled due to plugin runtime parser issues in current plugin version
      'rxjs/no-implicit-any-catch': 'off',
      'rxjs/no-nested-subscribe': 'error',
      'rxjs/no-unbound-methods': 'error',
      'rxjs/throw-error': 'error'
    }
  },
  // Tests and config files should be more permissive (e.g., use async/await in tests)
  {
    files: ['**/*.spec.ts', '**/*.test.ts', 'jest.config.ts', 'jest.config.js'],
    rules: {
      'no-restricted-syntax': 'off'
    }
  }
];