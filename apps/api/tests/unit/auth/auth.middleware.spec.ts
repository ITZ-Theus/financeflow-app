import jwt from 'jsonwebtoken'
import { authMiddleware, AuthRequest } from '../../../src/modules/auth/auth.middleware'
import { AppError } from '../../../src/shared/errors/AppError'
import { AppDataSource } from '../../../src/config/database'
import { makeRepository, makeUser } from '../../helpers/factories'

jest.mock('../../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}))

function makeRequest(token?: string): AuthRequest {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as AuthRequest
}

function makeToken(userId = 'user-uuid-1') {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui',
    { expiresIn: '1h' }
  )
}

describe('authMiddleware', () => {
  let userRepo: ReturnType<typeof makeRepository>

  beforeEach(() => {
    userRepo = makeRepository()
    ;(AppDataSource.getRepository as jest.Mock).mockReturnValue(userRepo)
  })

  it('deve liberar requisição com token válido e usuário existente', async () => {
    const req = makeRequest(makeToken())
    const next = jest.fn()
    userRepo.findOne.mockResolvedValue(makeUser())

    await authMiddleware(req, {} as any, next)

    expect(req.userId).toBe('user-uuid-1')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('deve retornar 401 quando o token aponta para um usuário inexistente', async () => {
    const req = makeRequest(makeToken('deleted-user-id'))
    userRepo.findOne.mockResolvedValue(null)

    await expect(authMiddleware(req, {} as any, jest.fn()))
      .rejects
      .toMatchObject({
        statusCode: 401,
        message: 'Sessão inválida. Faça login novamente.',
      } as Partial<AppError>)
  })

  it('deve retornar 401 quando o token não for enviado', async () => {
    await expect(authMiddleware(makeRequest(), {} as any, jest.fn()))
      .rejects
      .toMatchObject({ statusCode: 401, message: 'Token não fornecido' })
  })
})
