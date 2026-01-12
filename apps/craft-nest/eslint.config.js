const path = require('path');
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const baseConfig = require('../../eslint.base.config.js');
const tsParser = require('@typescript-eslint/parser');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  ...baseConfig,
  {
    ignores: ['**/jest.config.ts', '**/eslint.config.js'],
  },
  ...compat.extends(
    'plugin:nestjs/recommended',
    'plugin:rxjs/recommended'
  ),
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: path.resolve(__dirname, 'tsconfig.json'),
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      'nestjs': require('eslint-plugin-nestjs'),
      'rxjs': require('eslint-plugin-rxjs'),
    },
    rules: {
      // NestJS rules
      // 'nestjs/use-validation-pipe': 'error',
      // 'nestjs/use-authentication-guard': 'error',
      // 'nestjs/controller-methods-should-be-public': 'error',
      
      // RxJS rules
      'rxjs/no-async-subscribe': 'warn',
      'rxjs/no-ignored-observable': 'warn',
      'rxjs/no-implicit-any-catch': 'off',
      'rxjs/no-nested-subscribe': 'warn',
      'rxjs/no-unbound-methods': 'warn',
      'rxjs/throw-error': 'warn',
      'rxjs/no-sharereplay': 'warn',
      
      // Restricted syntax
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
      
      // Prefer hot observables (subjects) for state
      'rxjs/prefer-observer': 'warn',
      // 'rxjs/prefer-subject': 'error',
      
      // Custom rule placeholder
      // '@craft-fusion/gateway-realtime-data': 'error',
    },
  },
];