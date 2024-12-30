import baseConfig from '../../jest.config';

export default {
  ...baseConfig,
  displayName: 'craft-nest',
  testMatch: ['**/*.spec.ts'],
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  moduleNameMapper: {
    "@craft-nest/environments/environment": "<rootDir>/src/environments/environment"
  },
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/craft-nest',
};
