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
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'import/no-cycle': 'error',
    },
  },
];
