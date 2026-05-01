import request from 'supertest'
import { createApp } from '../helpers/app'

jest.mock('../../src/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}))

const app = createApp()

describe('Security middleware', () => {
  it('deve retornar e reaproveitar o request id informado pelo cliente', async () => {
    const res = await request(app)
      .get('/health')
      .set('X-Request-Id', 'test-request-id')

    expect(res.status).toBe(200)
    expect(res.headers['x-request-id']).toBe('test-request-id')
  })

  it('deve gerar request id quando a requisicao nao informa um', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.headers['x-request-id']).toEqual(expect.any(String))
  })

  it('deve aplicar headers de seguranca HTTP', async () => {
    const res = await request(app).get('/health')

    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN')
  })

  it('deve desabilitar cache em respostas da API autenticada', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'invalid@test.com' })

    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.headers.etag).toBeUndefined()
  })

  it('deve limitar excesso de tentativas nas rotas de autenticacao', async () => {
    let res: request.Response | undefined

    for (let attempt = 0; attempt < 21; attempt += 1) {
      res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid@test.com' })
    }

    expect(res?.status).toBe(429)
    expect(res?.body.message).toBe('Muitas tentativas. Tente novamente em alguns minutos.')
  })
})
