import { Response, Router } from 'express'
import { z } from 'zod'
import { AppDataSource } from '../../config/database'
import { Goal } from './goal.entity'
import { AppError } from '../../shared/errors/AppError'
import { authMiddleware, AuthRequest } from '../auth/auth.middleware'

class GoalService {
  private repo = AppDataSource.getRepository(Goal)

  async findAll(userId: string) {
    return this.repo.findBy({ userId })
  }

  async create(userId: string, data: { title: string; targetAmount: number; deadline: string }) {
    const goal = this.repo.create({ ...data, userId })
    return this.repo.save(goal)
  }

  async update(userId: string, id: string, data: Partial<{ title: string; targetAmount: number; currentAmount: number; deadline: string; status: 'active' | 'completed' | 'cancelled' }>) {
    const goal = await this.repo.findOneBy({ id, userId })
    if (!goal) throw new AppError('Meta não encontrada', 404)
    Object.assign(goal, data)
    if (goal.currentAmount >= goal.targetAmount) goal.status = 'completed'
    return this.repo.save(goal)
  }

  async delete(userId: string, id: string) {
    const goal = await this.repo.findOneBy({ id, userId })
    if (!goal) throw new AppError('Meta não encontrada', 404)
    await this.repo.remove(goal)
  }
}

const createSchema = z.object({
  title: z.string().min(1),
  targetAmount: z.number().positive(),
  deadline: z.string(),
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
  deadline: z.string().optional(),
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
