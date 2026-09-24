import { Request, Response } from 'express'
import { QueryFailedError } from 'typeorm'
import { z } from 'zod'
import { AppError } from '../../../src/shared/errors/AppError'
import { errorHandler } from '../../../src/shared/errors/errorHandler'

jest.mock('../../../src/shared/logging/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn() },
}))

import { logger } from '../../../src/shared/logging/logger'

function run(err: Error) {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }
  errorHandler(err, { requestId: 'req-1' } as Request, res as unknown as Response, jest.fn())
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] }
}

function databaseError(code: string) {
  return new QueryFailedError('SELECT 1', [], Object.assign(new Error('db'), { code }))
}

describe('errorHandler', () => {
  it('usa status e mensagem do AppError', () => {
    expect(run(new AppError('Meta não encontrada', 404)))
      .toEqual({ status: 404, body: { message: 'Meta não encontrada', requestId: 'req-1' } })
  })

  it('responde 422 com os campos invalidos do zod', () => {
    const result = z.object({ id: z.string().uuid() }).safeParse({ id: 'x' })
    if (result.success) throw new Error('expected failure')

    expect(run(result.error)).toMatchObject({
      status: 422,
      body: { message: 'Dados invalidos', errors: [{ field: 'id' }] },
    })
  })

  it.each([
    ['entity.parse.failed', 400, 'JSON invalido'],
    ['entity.too.large', 413, 'Corpo da requisicao muito grande'],
  ])('traduz erro do body-parser %s em %i', (type, status, message) => {
    const err = Object.assign(new Error('parser'), { type, status })

    expect(run(err)).toEqual({ status, body: { message, requestId: 'req-1' } })
  })

  it.each([
    ['22P02', 400],
    ['22007', 400],
    ['22008', 400],
    ['22003', 400],
    ['23505', 409],
  ])('traduz erro %s do PostgreSQL em %i e registra aviso', (code, status) => {
    expect(run(databaseError(code)).status).toBe(status)
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ code }), expect.any(String))
  })

  it('mantem 500 generico para erros de banco nao mapeados', () => {
    expect(run(databaseError('40001'))).toEqual({
      status: 500,
      body: { message: 'Erro interno do servidor', requestId: 'req-1' },
    })
    expect(logger.error).toHaveBeenCalled()
  })

  it('mantem 500 generico para erros inesperados', () => {
    expect(run(new Error('boom')).status).toBe(500)
  })
})

describe('AppError', () => {
  it('e uma instancia de Error com stack', () => {
    const err = new AppError('x', 404)

    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('AppError')
    expect(err.stack).toEqual(expect.any(String))
  })
})
