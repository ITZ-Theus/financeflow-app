import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AuthService } from '../../../src/modules/auth/auth.service'
import { AppError } from '../../../src/shared/errors/AppError'
import { makeUser, makeRepository } from '../../helpers/factories'

// Mock do AppDataSource para não precisar de banco real
jest.mock('../../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}))

import { AppDataSource } from '../../../src/config/database'

describe('AuthService', () => {
  let service: AuthService
  let userRepo: ReturnType<typeof makeRepository>

  beforeEach(() => {
    userRepo = makeRepository()
    ;(AppDataSource.getRepository as jest.Mock).mockReturnValue(userRepo)
    service = new AuthService()
  })

  // ─── REGISTER ──────────────────────────────────────────────
  describe('register', () => {
    it('deve criar um usuário e retornar token', async () => {
      const input = { name: 'João', email: 'joao@test.com', password: '123456' }
      const user  = makeUser({ id: 'new-uuid', name: input.name, email: input.email })

      userRepo.findOneBy.mockResolvedValue(null)      // e-mail não existe
      userRepo.create.mockReturnValue(user)
      userRepo.save.mockResolvedValue(user)

      const result = await service.register(input)

      expect(result.user.email).toBe(input.email)
      expect(result.token).toBeDefined()
      expect(typeof result.token).toBe('string')
    })

    it('deve lançar AppError se e-mail já estiver cadastrado', async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser())

      await expect(
        service.register({ name: 'João', email: 'joao@test.com', password: '123456' })
      ).rejects.toBeInstanceOf(AppError)
    })

    it('deve lançar erro com status 400 para e-mail duplicado', async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser())

      try {
        await service.register({ name: 'João', email: 'joao@test.com', password: '123456' })
      } catch (err) {
        expect(err).toBeInstanceOf(AppError)
        expect((err as AppError).statusCode).toBe(400)
        expect((err as AppError).message).toBe('E-mail já cadastrado')
      }
    })

    it('deve salvar a senha como hash bcrypt (nunca em plaintext)', async () => {
      const input = { name: 'João', email: 'joao@test.com', password: 'minha-senha-secreta' }
      const user  = makeUser()

      userRepo.findOneBy.mockResolvedValue(null)
      userRepo.create.mockReturnValue(user)
      userRepo.save.mockResolvedValue(user)

      await service.register(input)

      const savedPassword = userRepo.create.mock.calls[0][0].password
      expect(savedPassword).not.toBe(input.password)
      expect(savedPassword.startsWith('$2')).toBe(true) // prefixo bcrypt
    })

    it('deve retornar usuário sem campo password', async () => {
      const user = makeUser()
      userRepo.findOneBy.mockResolvedValue(null)
      userRepo.create.mockReturnValue(user)
      userRepo.save.mockResolvedValue(user)

      const result = await service.register({ name: 'João', email: 'joao@test.com', password: '123456' })

      expect(result.user).not.toHaveProperty('password')
    })
  })

  // ─── LOGIN ──────────────────────────────────────────────────
  describe('login', () => {
    it('deve retornar token com credenciais válidas', async () => {
      const password = 'senha-correta'
      const hashed   = await bcrypt.hash(password, 10)
      const user     = makeUser({ password: hashed })

      userRepo.findOne.mockResolvedValue(user)

      const result = await service.login({ email: user.email, password })

      expect(result.token).toBeDefined()
      expect(result.user.id).toBe(user.id)
    })

    it('deve lançar AppError 401 se usuário não existir', async () => {
      userRepo.findOne.mockResolvedValue(null)

      await expect(
        service.login({ email: 'naoexiste@test.com', password: '123456' })
      ).rejects.toMatchObject({ statusCode: 401, message: 'Credenciais inválidas' })
    })

    it('deve lançar AppError 401 se a senha estiver errada', async () => {
      const user = makeUser({ password: await bcrypt.hash('senha-correta', 10) })
      userRepo.findOne.mockResolvedValue(user)

      await expect(
        service.login({ email: user.email, password: 'senha-errada' })
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it('deve gerar um JWT válido com o userId no payload', async () => {
      const password = 'senha123'
      const user     = makeUser({ password: await bcrypt.hash(password, 10) })
      userRepo.findOne.mockResolvedValue(user)

      const result  = await service.login({ email: user.email, password })
      const decoded = jwt.decode(result.token) as { sub: string }

      expect(decoded.sub).toBe(user.id)
    })
  })
})
