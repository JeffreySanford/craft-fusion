import baseConfig from '../../jest.config';

export default {
  ...baseConfig,
  rootDir: '../../', // Set the rootDir to the correct path
  displayName: 'craft-web',
  preset: '../../jest.preset',
  setupFilesAfterEnv: ['./test-setup.ts'],
  coverageDirectory: '../../coverage/craft-web',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/apps/craft-web/tsconfig.spec.json', // Update the tsconfig path
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.e2e-spec.ts'
  ],
};
