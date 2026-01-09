/* eslint-disable */
export default {
  displayName: 'craft-nest',
  preset: '../../jest.preset.js',
  testEnvironment: 'node', // Explicitly set test environment to node
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/craft-nest',
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
  // Add setup file if needed for NestJS specific mocks or environment setup
  // setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
};
