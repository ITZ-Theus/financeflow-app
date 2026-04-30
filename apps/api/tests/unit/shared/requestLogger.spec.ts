import express from 'express'
import request from 'supertest'
import { requestLogger } from '../../../src/shared/middlewares/requestLogger'
import { logger } from '../../../src/shared/logging/logger'

jest.mock('../../../src/shared/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

function createTestApp(statusCode: number) {
  const app = express()

  app.use((req, _res, next) => {
    req.requestId = 'test-request-id'
    next()
  })
  app.use(requestLogger)
  app.get('/sample', (_req, res) => res.status(statusCode).json({ ok: statusCode < 400 }))

  return app
}

describe('requestLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('registra requests bem-sucedidos como info', async () => {
    await request(createTestApp(200)).get('/sample').set('User-Agent', 'jest')

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'test-request-id',
        method: 'GET',
        path: '/sample',
        statusCode: 200,
        userAgent: 'jest',
      }),
      'request completed'
    )
  })

  it('registra erros de cliente como warn', async () => {
    await request(createTestApp(404)).get('/sample')

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 }),
      'request completed'
    )
  })

  it('registra erros de servidor como error', async () => {
    await request(createTestApp(500)).get('/sample')

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500 }),
      'request completed'
    )
  })
})
