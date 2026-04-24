import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AppDataSource } from '../../config/database'
import { User } from '../users/user.entity'
import { AppError } from '../../shared/errors/AppError'
import { env } from '../../config/env'

interface RegisterDTO { name: string; email: string; password: string }
interface LoginDTO    { email: string; password: string }

export class AuthService {
  private userRepo = AppDataSource.getRepository(User)

  async register(data: RegisterDTO) {
    const exists = await this.userRepo.findOneBy({ email: data.email })
    if (exists) throw new AppError('E-mail já cadastrado')

    const hashed = await bcrypt.hash(data.password, 10)
    const user   = this.userRepo.create({ ...data, password: hashed })
    await this.userRepo.save(user)

    const token = this.generateToken(user.id)
    return { user: { id: user.id, name: user.name, email: user.email }, token }
  }

  async login(data: LoginDTO) {
    const user = await this.userRepo.findOne({
      where: { email: data.email },
      select: ['id', 'name', 'email', 'password'],
    })
    if (!user) throw new AppError('Credenciais inválidas', 401)

    const valid = await bcrypt.compare(data.password, user.password)
    if (!valid) throw new AppError('Credenciais inválidas', 401)

    const token = this.generateToken(user.id)
    return { user: { id: user.id, name: user.name, email: user.email }, token }
  }

  private generateToken(userId: string): string {
    return jwt.sign({ sub: userId }, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn,
    } as jwt.SignOptions)
  }
}
