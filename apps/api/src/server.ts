import { app } from './app'
import { AppDataSource } from './config/database'
import { env } from './config/env'
import { seedDemoData } from './seeds/demo'

const MAX_RETRIES = 10
const RETRY_DELAY_MS = 3000

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function connectDatabase(attempt = 1): Promise<void> {
  try {
    await AppDataSource.initialize()
    console.log('Database connected')
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      console.error('Error connecting to database:', err)
      process.exit(1)
    }

    console.warn(`Database unavailable, retrying (${attempt}/${MAX_RETRIES})...`)
    await wait(RETRY_DELAY_MS)
    await connectDatabase(attempt + 1)
  }
}

async function bootstrap() {
  await connectDatabase()
  if (env.demo.seedOnStartup) {
    await seedDemoData()
  }

  app.listen(env.port, () => {
    console.log(`API running on port ${env.port}`)
  })
}

bootstrap()
