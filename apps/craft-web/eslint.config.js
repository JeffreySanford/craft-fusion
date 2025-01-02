const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@typescript-eslint/no-unused-vars': 'warn',
      'import/no-cycle': 'error',
    },
    resolve: {
      fallback: {
        path: require.resolve('path-browserify'),
      },
    },
  },

  // Angular Template Configuration
  {
    files: ['**/*.html'],
    rules: {
      '@angular-eslint/template/no-negated-async': 'warn',
      "@angular-eslint/component-class-suffix": ["error", { "standalone": false }]
    },
    resolve: {
      fallback: {
        path: require.resolve('path-browserify'),
      },
    },
  },
];
