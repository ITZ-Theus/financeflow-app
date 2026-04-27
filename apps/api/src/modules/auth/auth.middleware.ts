import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env'
import { AppError } from '../../shared/errors/AppError'
import { AppDataSource } from '../../config/database'
import { User } from '../users/user.entity'

export interface AuthRequest extends Request {
  userId?: string
}

export async function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader) throw new AppError('Token não fornecido', 401)

  const [, token] = authHeader.split(' ')
  if (!token) throw new AppError('Token inválido', 401)

  try {
    const decoded = jwt.verify(token, env.jwt.secret) as { sub: string }
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: decoded.sub },
      select: ['id'],
    })

    if (!user) {
      throw new AppError('Sessão inválida. Faça login novamente.', 401)
    }

    req.userId = decoded.sub
    next()
  } catch (err) {
    if (err instanceof AppError) throw err
    throw new AppError('Token inválido ou expirado', 401)
  }
}
