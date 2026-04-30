import { app } from './app'
import { AppDataSource } from './config/database'
import { env } from './config/env'
import { seedDemoData } from './seeds/demo'
import { logger } from './shared/logging/logger'

const MAX_RETRIES = 10
const RETRY_DELAY_MS = 3000

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function connectDatabase(attempt = 1): Promise<void> {
  try {
    await AppDataSource.initialize()
    logger.info('database connected')
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      logger.error({ err }, 'error connecting to database')
      process.exit(1)
    }

    logger.warn({ attempt, maxRetries: MAX_RETRIES }, 'database unavailable, retrying')
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
    logger.info({ port: env.port }, 'api running')
  })
}

bootstrap()
