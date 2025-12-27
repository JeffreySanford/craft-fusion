export default {
  displayName: 'craft-web',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/apps/craft-web',
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.ts'],

  moduleFileExtensions: ['ts', 'js', 'mjs', 'html', 'json'],

  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      // Enable ESM support in ts-jest to ensure .ts and Angular ESM packages are handled correctly
      packageJson: '<rootDir>/package.json',
      useESM: true
    }
  },

  // Treat TypeScript files as ESM for Jest (ts-jest will handle transpilation)
  extensionsToTreatAsEsm: ['.ts'],

  transform: {
    // ts and js files
    '^.+\\.(ts|js|html)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    // Generic .mjs handler
    '^.+\\.mjs$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json', useESM: true }],
    // Target @angular/core ESM testing modules specifically (handles pnpm layout with nested node_modules)
    '^.+@angular\\/core.*\\.mjs$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json', useESM: true }],
  },

  // Allow transforming Angular ESM packages in node_modules and pnpm subpaths (ensure @angular .mjs files are transformed)
  transformIgnorePatterns: ['node_modules/(?!.*(@angular|jest-preset-angular)/)'],
};
