import { Request, Response } from 'express'
import { z } from 'zod'
import { AuthService } from './auth.service'

const registerSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(6),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

type RegisterInput = {
  name: string
  email: string
  password: string
}

type LoginInput = {
  email: string
  password: string
}

export class AuthController {
  private service = new AuthService()

  async register(req: Request, res: Response) {
    const data   = registerSchema.parse(req.body) as RegisterInput
    const result = await this.service.register(data)
    return res.status(201).json(result)
  }

  async login(req: Request, res: Response) {
    const data   = loginSchema.parse(req.body) as LoginInput
    const result = await this.service.login(data)
    return res.status(200).json(result)
  }
}
