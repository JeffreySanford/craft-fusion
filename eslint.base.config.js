const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const securityPlugin = require('eslint-plugin-security');

module.exports = [
  {
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'security': securityPlugin,
    },
    rules: {
      // Common rules for both frontend and backend
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'prefer-const': 'warn',
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-fs-filename': 'warn'
    }
  }
];
