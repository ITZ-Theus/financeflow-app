import { DataSource } from 'typeorm'
import { testDatabase } from './database-config'

// Recreate the test database on every run so migrations are always applied to an empty schema.
export default async function globalSetup() {
  const admin = new DataSource({
    type: 'postgres',
    host: testDatabase.host,
    port: testDatabase.port,
    username: testDatabase.user,
    password: testDatabase.password,
    database: 'postgres',
  })

  await admin.initialize()
  try {
    await admin.query(`DROP DATABASE IF EXISTS "${testDatabase.name}" WITH (FORCE)`)
    await admin.query(`CREATE DATABASE "${testDatabase.name}"`)
  } finally {
    await admin.destroy()
  }
}
