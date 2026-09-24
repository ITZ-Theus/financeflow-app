import type { Config } from 'jest'
import baseConfig from './jest.config'

// Tests in tests/db run the real app against a real PostgreSQL database (see tests/db/database-config.ts).
// They share one database, so they run serially.
const config: Config = {
  ...baseConfig,
  testMatch: ['<rootDir>/tests/db/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  globalSetup: '<rootDir>/tests/db/global-setup.ts',
  setupFiles: ['<rootDir>/tests/db/setup-env.ts'],
  maxWorkers: 1,
  testTimeout: 30_000,
}

export default config
