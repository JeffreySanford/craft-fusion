import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['ts', 'js', 'json', 'mjs'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
    '^.+\\.mjs$': 'babel-jest',
  },
  coverageDirectory: '../../coverage/apps/craft-nest',
  testEnvironment: 'node',
};

export default config;
