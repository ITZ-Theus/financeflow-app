import { testDatabase } from './database-config'

// Runs before each test file imports src/config/env, which reads these values once.
process.env.NODE_ENV = 'test'
process.env.DB_HOST = testDatabase.host
process.env.DB_PORT = String(testDatabase.port)
process.env.DB_USER = testDatabase.user
process.env.DB_PASS = testDatabase.password
process.env.DB_NAME = testDatabase.name
// Empty (not deleted) so dotenv cannot fill it back in and point the tests at another database.
process.env.DATABASE_URL = ''
process.env.DB_SSL = 'false'
process.env.DB_MIGRATIONS_RUN = 'false'
process.env.DEMO_SEED_ON_STARTUP = 'false'
// Each file registers several users; the auth limiter would otherwise answer 429.
process.env.AUTH_RATE_LIMIT_MAX = '10000'
