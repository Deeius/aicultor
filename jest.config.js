module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['api/**/*.js', '!node_modules/**'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  verbose: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  transform: {},
  moduleNameMapper: {
    '^@anthropic-ai/sdk$': '<rootDir>/tests/mocks/anthropic.mock.js',
  },
  transformIgnorePatterns: ['node_modules/(?!(@anthropic-ai)/)'],
};
