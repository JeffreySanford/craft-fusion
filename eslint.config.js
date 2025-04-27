const config = [
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: '@typescript-eslint/parser',
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.base.json',
      },
    },
    plugins: {
      '@angular-eslint': require('@angular-eslint/eslint-plugin'),
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'import': require('eslint-plugin-import'),
      'nestjs': require('eslint-plugin-nestjs'),
    },
    rules: {
      ...require('eslint:recommended').rules,
      ...require('plugin:@typescript-eslint/recommended').rules,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.base.json',
        },
      },
    },
    env: {
      browser: true,
      node: true,
      es6: true,
    },
    overrides: [],
  },
  // Add NestJS-specific configuration
  {
    files: ['apps/craft-nest/**/*.ts'],
    plugins: {
      'nestjs': require('eslint-plugin-nestjs'),
    },
    extends: [
      'plugin:nestjs/recommended',
    ],
    rules: {
      'nestjs/use-validation-pipe': 'error',
      'nestjs/use-authentication-guard': 'error',
      'nestjs/controller-methods-should-be-public': 'error',
    }
  }
];

module.exports = config;
