const { FlatCompat } = require('@eslint/eslintrc');
const nxPlugin = require('@nx/eslint-plugin');
const js = require('@eslint/js');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const angularPlugin = require('@angular-eslint/eslint-plugin');
const angularTemplatePlugin = require('@angular-eslint/eslint-plugin-template');
const importPlugin = require('eslint-plugin-import');
const nestjsPlugin = require('eslint-plugin-nestjs');
const rxjsPlugin = require('eslint-plugin-rxjs');
const ngrxPlugin = require('eslint-plugin-ngrx');
const tsParser = require('@typescript-eslint/parser');

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

module.exports = [
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        ignores: ['**/node_modules/**', '**/dist/**', '.nx/**', '.angular/**'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: './tsconfig.base.json', // Ensure this points to the base config
            },
        },
        plugins: {
            '@nx': nxPlugin,
            '@typescript-eslint': typescriptPlugin,
            '@angular-eslint': angularPlugin,
            'import': importPlugin,
            'nestjs': nestjsPlugin,
            'rxjs': rxjsPlugin,
            'ngrx': ngrxPlugin,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...typescriptPlugin.configs.recommended.rules,
            // Common rules from eslint.base.config.js
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/explicit-module-boundary-types': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
            'no-console': ['warn', { allow: ['warn', 'error', 'debug', 'info', 'log'] }], // Allow more console methods
            'prefer-const': 'error',
            // Import rules
            'import/no-cycle': 'error',
            // RxJS rules from root .eslintrc.js
            'rxjs/no-unsafe-takeuntil': 'error',
            // Ngrx rules from root .eslintrc.js
            ...ngrxPlugin.configs.recommended.rules,
            // General rules from root .eslintrc.json
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                { accessibility: 'explicit', overrides: { constructors: 'no-public' } }
            ],
            '@typescript-eslint/naming-convention': [
                'error',
                { selector: 'interface', format: ['PascalCase'], prefix: ['I'] },
                { selector: 'class', format: ['PascalCase'] },
                { selector: 'enum', format: ['PascalCase'] } // Added from nest .eslintrc.js
            ],
            'max-len': ['warn', { code: 120 }], // Increased max length
            'quotes': ['error', 'single', { avoidEscape: true }],
            'semi': ['error', 'always'],
            'eqeqeq': ['error', 'always'],
            'curly': 'error',
        },
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
            jest: true, // Added jest env
        },
    },
    // Angular specific files configuration
    {
        files: ['apps/craft-web/**/*.ts'],
        plugins: {
            '@angular-eslint': angularPlugin,
        },
        rules: {
            ...angularPlugin.configs.recommended.rules,
            '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
            '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
            '@angular-eslint/prefer-standalone': 'off', // Keep standalone off as per project structure
        },
    },
    // Angular template files configuration
    {
        files: ['apps/craft-web/**/*.html'],
        plugins: {
            '@angular-eslint/template': angularTemplatePlugin,
        },
        rules: {
            ...angularTemplatePlugin.configs.recommended.rules,
            ...angularTemplatePlugin.configs.accessibility.rules, // Include accessibility rules
            '@angular-eslint/template/no-negated-async': 'error', // Stricter than warn
            '@angular-eslint/template/accessibility-alt-text': 'error',
            '@angular-eslint/template/accessibility-elements-content': 'error',
            '@angular-eslint/template/accessibility-label-has-associated-control': 'error',
            '@angular-eslint/template/no-positive-tabindex': 'error',
        },
    },
    // NestJS specific files configuration
    {
        files: ['apps/craft-nest/**/*.ts'],
        plugins: {
            'nestjs': nestjsPlugin,
            'rxjs': rxjsPlugin,
        },
        rules: {
            ...nestjsPlugin.configs.recommended.rules,
            ...rxjsPlugin.configs.recommended.rules,
            'nestjs/use-validation-pipe': 'error',
            'nestjs/use-authentication-guard': 'error', // From eslint.config.js override
            'nestjs/controller-methods-should-be-public': 'error', // From eslint.config.js override
            'nestjs/controllers-should-supply-api-tags': 'warn', // From nest .eslintrc.js
            // RxJS rules from nest eslint.config.js
            'rxjs/no-async-subscribe': 'error',
            'rxjs/no-ignored-observable': 'error',
            'rxjs/no-implicit-any-catch': 'error',
            'rxjs/no-nested-subscribe': 'error',
            'rxjs/no-unbound-methods': 'error',
            'rxjs/throw-error': 'error',
            'rxjs/prefer-observer': 'error',
            'rxjs/prefer-subject': 'error',
            // Ban async/await and toPromise in NestJS
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'CallExpression[callee.property.name="toPromise"]',
                    message: 'Use Observables instead of converting to Promises with toPromise() in NestJS code.'
                },
                {
                    selector: 'FunctionDeclaration[async=true]',
                    message: 'Avoid async/await in NestJS code. Use Observables instead.'
                },
                {
                    selector: 'FunctionExpression[async=true]',
                    message: 'Avoid async/await in NestJS code. Use Observables instead.'
                },
                {
                    selector: 'ArrowFunctionExpression[async=true]',
                    message: 'Avoid async/await in NestJS code. Use Observables instead.'
                }
            ],
        },
    },
    // E2E specific files configuration (Example for craft-web-e2e)
    {
        files: ['apps/craft-web-e2e/**/*.ts', 'apps/craft-nest-e2e/**/*.ts'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            // Relax rules specific to tests if needed
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
        },
    },
    // Include Prettier compatibility last
    ...compat.extends('prettier'),
];
