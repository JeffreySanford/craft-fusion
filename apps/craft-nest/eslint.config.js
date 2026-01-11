const baseConfig = require('../../eslint.base.config.js');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        "tsconfigRootDir": "./",
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'nestjs': require('eslint-plugin-nestjs'),
      'rxjs': require('eslint-plugin-rxjs'),
    },
    extends: [
      'plugin:nestjs/recommended',
      'plugin:rxjs/recommended',
    ],
    rules: {
      // NestJS rules
      'nestjs/use-validation-pipe': 'error',
      'nestjs/use-authentication-guard': 'error',
      'nestjs/controller-methods-should-be-public': 'error',
      
      // RxJS rules
      'rxjs/no-async-subscribe': 'error',
      'rxjs/no-ignored-observable': 'error',
      'rxjs/no-implicit-any-catch': 'error',
      'rxjs/no-nested-subscribe': 'error',
      'rxjs/no-unbound-methods': 'error',
      'rxjs/throw-error': 'error',
      
      // Prefer Observables over Promises
      'no-restricted-syntax': ['error', 
        {
          selector: 'CallExpression[callee.property.name="toPromise"]',
          message: 'Use Observables instead of converting to Promises with toPromise()'
        }
      ],
      
      // Ban async/await
      'no-restricted-syntax': ['error', 
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
      'rxjs/prefer-observer': 'error',
      'rxjs/prefer-subject': 'error',
      
      // Custom rule for realtime data through gateways
      // This is a placeholder for a custom rule we'll define separately
      '@craft-fusion/gateway-realtime-data': 'error',
    },
  },
];