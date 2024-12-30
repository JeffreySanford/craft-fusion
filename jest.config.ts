import nxPreset from './jest.preset';

export default {
  ...nxPreset,
  coverageDirectory: './coverage',
  coverageReporters: ['text-summary', 'lcov'],
  testEnvironment: 'node',
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports/jest',
      outputName: 'results.xml'
    }]
  ],
  setupFilesAfterEnv: ['./test-setup.ts']
};
