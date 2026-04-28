import { randomUUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'

declare global {
  namespace Express {
    interface Request {
      requestId: string
    }
  }
}

function getRequestId(req: Request): string {
  const header = req.headers['x-request-id']
  const value = Array.isArray(header) ? header[0] : header

  if (value && value.length <= 100) return value

  return randomUUID()
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  req.requestId = getRequestId(req)
  res.setHeader('X-Request-Id', req.requestId)
  next()
}
