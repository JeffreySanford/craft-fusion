export default {
  displayName: 'craft-nest',
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
