import { Request, Response, NextFunction } from 'express'
import { AppError } from './AppError'
import { ZodError } from 'zod'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message })
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      message: 'Dados inválidos',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
  }

  console.error(err)
  return res.status(500).json({ message: 'Erro interno do servidor' })
}
