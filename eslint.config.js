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
];

module.exports = config;
