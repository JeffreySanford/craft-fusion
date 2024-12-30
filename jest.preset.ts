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
        tsconfig: '<rootDir>/tsconfig.json',
        stringifyContentPathRegex: '\\.(html|svg)$'
      }
    ]
  },
  resolver: '@nrwl/jest/plugins/resolver',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
};
