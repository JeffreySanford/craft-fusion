export default {
  displayName: 'craft-web',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/apps/craft-web',
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.ts'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  transformIgnorePatterns: ['node_modules/(?!(@angular|jest-preset-angular))'],
};
