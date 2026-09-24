import request from 'supertest'
import { Express } from 'express'
import { AppDataSource } from '../../src/config/database'

// Connects the app's real DataSource to the test database for the current test file
// and empties every table before each test.
export function useTestDatabase() {
  beforeAll(async () => {
    await AppDataSource.initialize()

    const [{ current_database: name }] = await AppDataSource.query('SELECT current_database()')
    if (!name.endsWith('_test')) {
      throw new Error(`Refusing to run database tests against "${name}"`)
    }

    await AppDataSource.runMigrations()
  })

  beforeEach(async () => {
    const tables = AppDataSource.entityMetadatas.map((metadata) => `"${metadata.tableName}"`)
    await AppDataSource.query(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`)
  })

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy()
  })
}

let userSequence = 0

export async function registerUser(app: Express, name = 'Test User') {
  userSequence += 1

  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email: `user${userSequence}@financeflow.test`, password: 'password123' })

  if (res.status !== 201) {
    throw new Error(`Failed to register test user: ${res.status} ${JSON.stringify(res.body)}`)
  }

  return {
    token: res.body.token as string,
    user: res.body.user as { id: string; name: string; email: string },
  }
}
