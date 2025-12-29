import type { Config } from 'jest';

const config: Config = {
  displayName: 'craft-nest-e2e',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: [
    '<rootDir>/src/**/*.e2e-spec.ts',
    '<rootDir>/test/**/*.e2e-spec.ts',
  ],
  coverageDirectory: '../../coverage/apps/craft-nest-e2e',
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/../craft-nest/src/$1',
  },
  verbose: true,
};

export default config;
