import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.base.json';

export default {
  moduleFileExtensions: ['ts', 'js', 'html'],
  rootDir: '.',
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  transform: {
    '^.+\\.(ts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.json', // Ensure this points to a relevant tsconfig if needed at root level, or override in project configs
        stringifyContentPathRegex: '\\.(html|svg)$'
      }
    ]
  },
  resolver: '@nx/jest/plugins/resolver',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  testEnvironment: 'jsdom', // Changed default to jsdom for Angular, NestJS will override
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'], // Corrected path from test-setup.ts to jest.setup.ts if that's the intended file
};
