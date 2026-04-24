import 'reflect-metadata'
import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import { errorHandler } from './shared/errors/errorHandler'
import { authRoutes } from './modules/auth/auth.routes'
import { transactionRoutes } from './modules/transactions/transaction.routes'
import { categoryRoutes } from './modules/categories/category.routes'
import { goalRoutes } from './modules/goals/goal.routes'

export function createApp() {
  const app = express()

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
  app.use(express.json())

  app.get('/health', (_req, res) => res.json({ status: 'ok' }))

  app.use('/api/auth', authRoutes)
  app.use('/api/transactions', transactionRoutes)
  app.use('/api/categories', categoryRoutes)
  app.use('/api/goals', goalRoutes)

  app.use(errorHandler)

  return app
}

export const app = createApp()
