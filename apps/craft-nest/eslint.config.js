const { FlatCompat } = require('@eslint/eslintrc');
const baseConfig = require('../../eslint.base.config.js');
const tsParser = require('@typescript-eslint/parser');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  ...baseConfig,
  ...compat.extends('plugin:nestjs/recommended'),
  ...compat.extends('plugin:rxjs/recommended'),
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        "tsconfigRootDir": __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'nestjs': require('eslint-plugin-nestjs'),
      'rxjs': require('eslint-plugin-rxjs'),
    },
    rules: {
      // NestJS rules
      // 'nestjs/use-validation-pipe': 'error',
      // 'nestjs/use-authentication-guard': 'error',
      // 'nestjs/controller-methods-should-be-public': 'error',
      
      // RxJS rules
      'rxjs/no-async-subscribe': 'error',
      'rxjs/no-ignored-observable': 'error',
      'rxjs/no-implicit-any-catch': 'off',
      'rxjs/no-nested-subscribe': 'error',
      'rxjs/no-unbound-methods': 'error',
      'rxjs/throw-error': 'error',
      
      // Relaxed rules to unblock development
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      
      // Prefer Observables over Promises
      // 'no-restricted-syntax': ['error', 
      //   {
      //     selector: 'CallExpression[callee.property.name="toPromise"]',
      //     message: 'Use Observables instead of converting to Promises with toPromise()'
      //   }
      // ],
      
      // Ban async/await - Disabled as it's too restrictive for NestJS
      // 'no-restricted-syntax': ['error', 
      //   {
      //     selector: 'FunctionDeclaration[async=true]',
      //     message: 'Avoid async/await. Use Observables instead.'
      //   },
      //   {
      //     selector: 'FunctionExpression[async=true]',
      //     message: 'Avoid async/await. Use Observables instead.'
      //   },
      //   {
      //     selector: 'ArrowFunctionExpression[async=true]',
      //     message: 'Avoid async/await. Use Observables instead.'
      //   }
      // ],
      
      // Prefer hot observables (subjects) for state
      // 'rxjs/prefer-observer': 'error',
      // 'rxjs/prefer-subject': 'error',
      
      // Custom rule for realtime data through gateways
      // This is a placeholder for a custom rule we'll define separately
      // '@craft-fusion/gateway-realtime-data': 'error',
    },
  },
];