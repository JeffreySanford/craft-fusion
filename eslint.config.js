const { FlatCompat } = require('@eslint/eslintrc');
const nxPlugin = require('@nrwl/eslint-plugin-nx');
const js = require('@eslint/js');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    resolvePluginsRelativeTo: __dirname,
});

module.exports = [
    js.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '.nx/**',
            '.angular/**',
            'playwright-report/**',
            'test-results/**',
            'coverage/**',
            'tmp/**',
            'scripts/**',
            'tools/**',
            '**/*.min.js',
            '**/*.bundle.js',
            '**/*.generated.js',
            'apps/*/src/generated/**',
            'libs/*/src/generated/**',
            '**/build/**',
            '**/out/**',
            'sast-results.json'
        ],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                // Node.js globals
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                global: 'readonly',
                
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                location: 'readonly',
                history: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                XMLHttpRequest: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                WebSocket: 'readonly',
                Blob: 'readonly',
                File: 'readonly',
                FileReader: 'readonly',
                FormData: 'readonly',
                Headers: 'readonly',
                Request: 'readonly',
                Response: 'readonly',
                Event: 'readonly',
                CustomEvent: 'readonly',
                EventTarget: 'readonly',
                Node: 'readonly',
                Element: 'readonly',
                HTMLElement: 'readonly',
                HTMLInputElement: 'readonly',
                HTMLTextAreaElement: 'readonly',
                Image: 'readonly',
                MouseEvent: 'readonly',
                KeyboardEvent: 'readonly',
                TouchEvent: 'readonly',
                PointerEvent: 'readonly',
                FocusEvent: 'readonly',
                DragEvent: 'readonly',
                WheelEvent: 'readonly',
                DeviceOrientationEvent: 'readonly',
                DeviceMotionEvent: 'readonly',
                MutationObserver: 'readonly',
                IntersectionObserver: 'readonly',
                ResizeObserver: 'readonly',
                performance: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                atob: 'readonly',
                btoa: 'readonly',
                crypto: 'readonly',
                
                // Web Workers and Streams
                Worker: 'readonly',
                SharedWorker: 'readonly',
                ServiceWorker: 'readonly',
                ReadableStream: 'readonly',
                WritableStream: 'readonly',
                TransformStream: 'readonly',
                CompressionStream: 'readonly',
                DecompressionStream: 'readonly',
                TextEncoder: 'readonly',
                TextDecoder: 'readonly',
                
                // Other Web APIs
                addEventListener: 'readonly',
                removeEventListener: 'readonly',
                self: 'readonly',
                
                // Testing globals
                jest: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                expect: 'readonly',
                jasmine: 'readonly',
            },
        },
        plugins: {
            '@nx': nxPlugin,
            '@typescript-eslint': typescriptPlugin,
            // local rules (see tools/eslint-rules)
            'local-rules': require('./tools/eslint-rules'),
        },
        rules: {
            // Basic rules
            'no-console': ['warn', { allow: ['warn', 'error', 'debug', 'info', 'log'] }],
            'prefer-const': 'error',
            'quotes': ['error', 'single', { avoidEscape: true }],
            'semi': ['error', 'always'],
            'eqeqeq': ['error', 'always'],
            'curly': 'error',
            'max-len': ['warn', { code: 120 }],
            // TypeScript rules
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            // Prohibit constructing service classes with `new` — require DI
            'local-rules/no-new-service': 'error',
        },
    },
    // E2E specific files configuration
    {
        files: ['apps/craft-web-e2e/**/*.ts', 'apps/craft-nest-e2e/**/*.ts'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
        },
    },
    // Typed linting for TypeScript projects (enables rules that need type information)
    {
        files: ['apps/*/src/**/*.ts', 'libs/*/src/**/*.ts', 'apps/*/src/**/*.tsx', 'libs/*/src/**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: [
                    './apps/*/tsconfig.json',
                    './apps/*/tsconfig.*.json',
                    './libs/*/tsconfig.json',
                    './libs/*/tsconfig.*.json'
                ]
            }
        },
        rules: {
            // Require explicit handling of Promises
            '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true, ignoreIIFE: true }],
            // Encourage explicit return types for public functions (warn to start)
            '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true, allowTypedFunctionExpressions: true }],
            '@typescript-eslint/explicit-module-boundary-types': 'warn',
            // Make `any` stricter in typed source files
            '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true }]
        }
    },
    // Tests (spec) files should be more permissive for now to avoid huge churn
    {
        files: ['**/*.spec.ts', '**/*.test.ts'],
        rules: {
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'warn'
        }
    },
    ...compat.extends('prettier'),
];
