module.exports = {
  rules: {
    // Common rules for both frontend and backend
    // Start as warnings at base level to allow gradual fixes
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error'
  }
};
