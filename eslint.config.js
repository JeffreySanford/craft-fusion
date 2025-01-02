const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    // Exclude unnecessary files from linting
    ignores: ['node_modules', 'dist', '**/src/polyfills.ts'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json'], // Use the specific tsconfig for e2e
        tsconfigRootDir: __dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: ['@typescript-eslint', '@angular-eslint'],
    extends: [
      'plugin:@typescript-eslint/recommended',
      'plugin:@angular-eslint/recommended',
    ],
    rules: {
      // Angular ESLint Rules
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],

      // TypeScript ESLint Rules
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Override specific Angular rules
      '@angular-eslint/prefer-standalone': 'off',
    },
  },
  {
    files: ['**/*.html'],
    plugins: ['@angular-eslint/template'],
    extends: ['plugin:@angular-eslint/template/recommended'],
    rules: {
      // Add HTML-specific rules if needed
      '@angular-eslint/template/no-negated-async': 'error',
    },
  },
];
