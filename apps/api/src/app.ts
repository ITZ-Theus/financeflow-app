import 'reflect-metadata'
import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { errorHandler } from './shared/errors/errorHandler'
import { requestContext } from './shared/middlewares/requestContext'
import { requestLogger } from './shared/middlewares/requestLogger'
import { authRoutes } from './modules/auth/auth.routes'
import { transactionRoutes } from './modules/transactions/transaction.routes'
import { categoryRoutes } from './modules/categories/category.routes'
import { goalRoutes } from './modules/goals/goal.routes'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(requestContext)
  app.use(requestLogger)
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }))
  app.use(cors({
    origin(origin, callback) {
      if (!origin || !env.corsOrigins.length || env.corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(null, false)
    },
    credentials: true,
  }))
  app.use(express.json({ limit: env.security.bodyLimit }))

  const authRateLimit = rateLimit({
    windowMs: env.security.authRateLimitWindowMs,
    limit: env.security.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Muitas tentativas. Tente novamente em alguns minutos.' },
  })

  app.get('/health', (_req, res) => res.json({ status: 'ok' }))

  app.use('/api/auth', authRateLimit, authRoutes)
  app.use('/api/transactions', transactionRoutes)
  app.use('/api/categories', categoryRoutes)
  app.use('/api/goals', goalRoutes)

  app.use(errorHandler)

  return app
}

export const app = createApp()
