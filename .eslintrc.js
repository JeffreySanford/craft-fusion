module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@angular-eslint/recommended',
    'plugin:@angular-eslint/template/process-inline-templates',
    'plugin:rxjs/recommended',
    'plugin:ngrx/recommended',
    'prettier',
  ],
  plugins: [
    '@typescript-eslint',
    '@angular-eslint',
    'rxjs',
    'ngrx',
  ],
  rules: {
    // Add or override rules here
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
    'rxjs/no-unsafe-takeuntil': 'error',
  },
};
