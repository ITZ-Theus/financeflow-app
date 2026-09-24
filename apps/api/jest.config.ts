import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.spec.ts', '**/tests/**/*.test.ts'],
  // tests/db needs PostgreSQL and runs through jest.db.config.ts (npm run test:db).
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/db/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/modules/**/*.service.ts',
    'src/modules/**/*.controller.ts',
    'src/shared/**/*.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
    },
  },
  coverageReporters: ['text', 'lcov'],
  clearMocks: true,
  restoreMocks: true,
}

export default config
