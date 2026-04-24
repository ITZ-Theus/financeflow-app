import { Router } from 'express'
import { AuthController } from './auth.controller'

const controller = new AuthController()
export const authRoutes = Router()

authRoutes.post('/register', (req, res) => controller.register(req, res))
authRoutes.post('/login',    (req, res) => controller.login(req, res))
