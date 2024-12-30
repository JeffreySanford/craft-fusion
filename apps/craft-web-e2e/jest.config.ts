import baseConfig from '../../jest.preset';

export default {
  ...baseConfig,
  displayName: 'craft-web-e2e',
  preset: '../../jest.preset',
  setupFilesAfterEnv: ['./test-setup.ts'],
  coverageDirectory: '../../coverage/craft-web-e2e',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
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
