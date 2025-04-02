import { getJestProjects } from '@nx/jest';

export default {
  projects: getJestProjects(),
  preset: './jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
  globalSetup: 'jest-preset-angular/global-setup'
};
