import { Response, Router } from 'express'
import { z } from 'zod'
import { authMiddleware, AuthRequest } from '../auth/auth.middleware'
import { BudgetDTO, BudgetService } from './budget.service'

const budgetSchema = z.object({
  amount: z.coerce.number().positive(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  categoryId: z.string().uuid(),
})

const budgetQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
})

class BudgetController {
  private service = new BudgetService()

  async index(req: AuthRequest, res: Response) {
    const query = budgetQuerySchema.parse(req.query)
    return res.json(await this.service.findAll(req.userId!, query))
  }

  async store(req: AuthRequest, res: Response) {
    const data = budgetSchema.parse(req.body) as BudgetDTO
    return res.status(201).json(await this.service.create(req.userId!, data))
  }

  async update(req: AuthRequest, res: Response) {
    const data = budgetSchema.partial().parse(req.body)
    return res.json(await this.service.update(req.userId!, req.params.id, data))
  }

  async destroy(req: AuthRequest, res: Response) {
    await this.service.delete(req.userId!, req.params.id)
    return res.status(204).send()
  }
}

const router = Router()
const controller = new BudgetController()

router.use(authMiddleware)
router.get('/', (req, res) => controller.index(req as AuthRequest, res))
router.post('/', (req, res) => controller.store(req as AuthRequest, res))
router.put('/:id', (req, res) => controller.update(req as AuthRequest, res))
router.delete('/:id', (req, res) => controller.destroy(req as AuthRequest, res))

export { router as budgetRoutes }
