// Connection settings for the throwaway database used by tests/db.
// Defaults match the docker compose network and the CI Postgres service.
export const testDatabase = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'financeflow',
  password: process.env.DB_PASS || 'financeflow123',
  name: process.env.TEST_DB_NAME || 'financeflow_test',
}

// These tests drop and truncate the database, so only accept names that are clearly disposable.
if (!/^[a-z0-9_]+_test$/.test(testDatabase.name)) {
  throw new Error(`Refusing to use "${testDatabase.name}" as test database: the name must end with _test`)
}
