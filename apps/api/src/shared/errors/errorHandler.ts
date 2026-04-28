import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from './AppError'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  const requestId = req.requestId

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, requestId })
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      message: 'Dados invalidos',
      requestId,
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
  }

  console.error({
    requestId,
    message: err.message,
    stack: err.stack,
  })

  return res.status(500).json({ message: 'Erro interno do servidor', requestId })
}
