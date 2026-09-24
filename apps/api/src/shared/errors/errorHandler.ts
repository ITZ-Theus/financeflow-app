import { Request, Response, NextFunction } from 'express'
import { QueryFailedError } from 'typeorm'
import { ZodError } from 'zod'
import { AppError } from './AppError'
import { logger } from '../logging/logger'

// Errors raised by express.json() (body-parser) carry a `type` and a 4xx `status`.
type BodyParserError = Error & { type?: string; status?: number }

const BODY_PARSER_ERRORS: Record<string, { status: number; message: string }> = {
  'entity.parse.failed': { status: 400, message: 'JSON invalido' },
  'entity.too.large': { status: 413, message: 'Corpo da requisicao muito grande' },
}

// Safety net for input that slipped past validation. Validation at the route is still the
// primary defense; these are logged so the missing validation can be added.
const DATABASE_ERRORS: Record<string, { status: number; message: string }> = {
  '22P02': { status: 400, message: 'Dados invalidos' },   // invalid_text_representation (e.g. uuid)
  '22007': { status: 400, message: 'Dados invalidos' },   // invalid_datetime_format
  '22008': { status: 400, message: 'Dados invalidos' },   // datetime_field_overflow
  '22003': { status: 400, message: 'Dados invalidos' },   // numeric_value_out_of_range
  '23505': { status: 409, message: 'Registro duplicado' }, // unique_violation
}

function getDatabaseErrorCode(err: Error): string | undefined {
  if (!(err instanceof QueryFailedError)) return undefined
  return (err.driverError as { code?: string } | undefined)?.code
}

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

  const bodyParserError = BODY_PARSER_ERRORS[(err as BodyParserError).type ?? '']
  if (bodyParserError) {
    return res.status(bodyParserError.status).json({ message: bodyParserError.message, requestId })
  }

  const databaseCode = getDatabaseErrorCode(err)
  const databaseError = databaseCode ? DATABASE_ERRORS[databaseCode] : undefined
  if (databaseError) {
    logger.warn({ requestId, code: databaseCode, message: err.message }, 'database rejected unvalidated input')
    return res.status(databaseError.status).json({ message: databaseError.message, requestId })
  }

  logger.error({
    requestId,
    message: err.message,
    stack: err.stack,
  }, 'unhandled application error')

  return res.status(500).json({ message: 'Erro interno do servidor', requestId })
}
