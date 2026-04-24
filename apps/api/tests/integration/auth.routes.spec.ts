import request from 'supertest'
import { createApp } from '../helpers/app'
import { AuthService } from '../../src/modules/auth/auth.service'

// Mock do AuthService para não precisar de banco
jest.mock('../../src/modules/auth/auth.service')
jest.mock('../../src/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}))

const app = createApp()
const MockedAuthService = AuthService as jest.MockedClass<typeof AuthService>

describe('Auth Routes - POST /api/auth', () => {
  beforeEach(() => {
    MockedAuthService.mockClear()
  })

  // ─── REGISTER ──────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('deve retornar 201 com token ao registrar com dados válidos', async () => {
      MockedAuthService.prototype.register.mockResolvedValue({
        user: { id: 'uuid-1', name: 'João', email: 'joao@test.com' },
        token: 'jwt-token-mock',
      })

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'João', email: 'joao@test.com', password: '123456' })

      expect(res.status).toBe(201)
      expect(res.body.token).toBeDefined()
      expect(res.body.user).not.toHaveProperty('password')
    })

    it('deve retornar 422 se e-mail for inválido', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'João', email: 'nao-é-email', password: '123456' })

      expect(res.status).toBe(422)
      expect(res.body.errors).toBeDefined()
    })

    it('deve retornar 422 se senha tiver menos de 6 caracteres', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'João', email: 'joao@test.com', password: '123' })

      expect(res.status).toBe(422)
    })

    it('deve retornar 422 se name estiver faltando', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'joao@test.com', password: '123456' })

      expect(res.status).toBe(422)
    })

    it('deve retornar 400 se e-mail já estiver cadastrado', async () => {
      const { AppError } = await import('../../src/shared/errors/AppError')
      MockedAuthService.prototype.register.mockRejectedValue(
        new AppError('E-mail já cadastrado', 400)
      )

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'João', email: 'joao@test.com', password: '123456' })

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('E-mail já cadastrado')
    })
  })

  // ─── LOGIN ──────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('deve retornar 200 com token ao logar com credenciais válidas', async () => {
      MockedAuthService.prototype.login.mockResolvedValue({
        user: { id: 'uuid-1', name: 'João', email: 'joao@test.com' },
        token: 'jwt-token-mock',
      })

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'joao@test.com', password: '123456' })

      expect(res.status).toBe(200)
      expect(res.body.token).toBeDefined()
    })

    it('deve retornar 401 com credenciais inválidas', async () => {
      const { AppError } = await import('../../src/shared/errors/AppError')
      MockedAuthService.prototype.login.mockRejectedValue(
        new AppError('Credenciais inválidas', 401)
      )

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'joao@test.com', password: 'senha-errada' })

      expect(res.status).toBe(401)
    })

    it('deve retornar 422 se e-mail estiver faltando', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: '123456' })

      expect(res.status).toBe(422)
    })
  })

  // ─── HEALTH CHECK ──────────────────────────────────────────
  describe('GET /health', () => {
    it('deve retornar status ok', async () => {
      const res = await request(app).get('/health')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ status: 'ok' })
    })
  })
})
