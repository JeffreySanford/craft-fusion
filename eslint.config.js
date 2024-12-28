const nx = require('@nx/eslint-plugin');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  ...nx.configs['flat/typescript'], 
  {
    plugins: {
      '@typescript-eslint': tsPlugin,
      'import': importPlugin,
    },
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.base.json'],
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'import/no-cycle': 'error',
    },
  },
];
