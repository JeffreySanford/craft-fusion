import { getJestProjects } from '@nx/jest';

export default {
  projects: getJestProjects(),
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.spec.json',
      useESM: true,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
};
