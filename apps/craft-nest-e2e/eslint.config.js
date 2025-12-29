const baseConfig = require('../../eslint.config.js');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'import/no-cycle': 'error',
    },
  },
];
