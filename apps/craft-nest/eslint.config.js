const baseConfig = require('../../eslint.config.js');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: '../../tsconfig.base.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
    lint: {
      executor: '@nx/eslint:lint',
      outputs: ['{options.outputFile}'],
      options: {
        lintFilePatterns: ['apps/craft-nest-e2e/**/*.ts'],
      },
    },
  },
];