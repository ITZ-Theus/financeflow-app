import { NextFunction, Request, Response } from 'express'
import { logger } from '../logging/logger'

type LogLevel = 'info' | 'warn' | 'error'

type RequestWithUser = Request & {
  userId?: string
}

function getLogLevel(statusCode: number): LogLevel {
  if (statusCode >= 500) return 'error'
  if (statusCode >= 400) return 'warn'
  return 'info'
}

export function requestLogger(req: RequestWithUser, res: Response, next: NextFunction) {
  const startedAt = Date.now()

  res.on('finish', () => {
    const statusCode = res.statusCode
    const durationMs = Date.now() - startedAt
    const logLevel = getLogLevel(statusCode)

    logger[logLevel]({
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode,
      durationMs,
      userId: req.userId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }, 'request completed')
  })

  next()
}
