import { Response, Router } from 'express'
import { z } from 'zod'
import { authMiddleware, AuthRequest } from '../auth/auth.middleware'
import { isoDateSchema } from '../../shared/validation/date'
import { GoalService } from './goal.service'

const createSchema = z.object({
  title: z.string().min(1),
  targetAmount: z.number().positive(),
  deadline: isoDateSchema,
})

type CreateGoalInput = {
  title: string
  targetAmount: number
  deadline: string
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  deadline: isoDateSchema.optional(),
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
})

class GoalController {
  private service = new GoalService()

  async index(req: AuthRequest, res: Response) {
    return res.json(await this.service.findAll(req.userId!))
  }

  async store(req: AuthRequest, res: Response) {
    const data = createSchema.parse(req.body) as CreateGoalInput
    return res.status(201).json(await this.service.create(req.userId!, data))
  }

  async update(req: AuthRequest, res: Response) {
    const data = updateSchema.parse(req.body)
    return res.json(await this.service.update(req.userId!, req.params.id, data))
  }

  async destroy(req: AuthRequest, res: Response) {
    await this.service.delete(req.userId!, req.params.id)
    return res.status(204).send()
  }
}

const router = Router()
const controller = new GoalController()

router.use(authMiddleware)
router.get('/', (req, res) => controller.index(req as AuthRequest, res))
router.post('/', (req, res) => controller.store(req as AuthRequest, res))
router.put('/:id', (req, res) => controller.update(req as AuthRequest, res))
router.delete('/:id', (req, res) => controller.destroy(req as AuthRequest, res))

export { router as goalRoutes }
