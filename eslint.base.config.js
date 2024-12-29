module.exports = [
  {
    files: ['**/*.ts', '**/*.js'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: './tsconfig.base.json',
    },
    plugins: ['@typescript-eslint', 'import'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ],
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
  }
];
