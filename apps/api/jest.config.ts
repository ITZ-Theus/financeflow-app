import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.spec.ts', '**/tests/**/*.test.ts'],
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
