import { Response, Router } from 'express'
import { z } from 'zod'
import { AppDataSource } from '../../config/database'
import { Category } from './category.entity'
import { AppError } from '../../shared/errors/AppError'
import { authMiddleware, AuthRequest } from '../auth/auth.middleware'

class CategoryService {
  private repo = AppDataSource.getRepository(Category)

  async findAll(userId: string) {
    return this.repo.findBy({ userId })
  }

  async create(userId: string, data: { name: string; color?: string; icon?: string; type: 'income' | 'expense' }) {
    const category = this.repo.create({ ...data, userId })
    return this.repo.save(category)
  }

  async update(userId: string, id: string, data: Partial<{ name: string; color: string; icon: string }>) {
    const category = await this.repo.findOneBy({ id, userId })
    if (!category) throw new AppError('Categoria não encontrada', 404)
    Object.assign(category, data)
    return this.repo.save(category)
  }

  async delete(userId: string, id: string) {
    const category = await this.repo.findOneBy({ id, userId })
    if (!category) throw new AppError('Categoria não encontrada', 404)
    await this.repo.remove(category)
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  icon: z.string().optional(),
  type: z.enum(['income', 'expense']),
})

type CreateCategoryInput = {
  name: string
  color?: string
  icon?: string
  type: 'income' | 'expense'
}

class CategoryController {
  private service = new CategoryService()

  async index(req: AuthRequest, res: Response) {
    return res.json(await this.service.findAll(req.userId!))
  }

  async store(req: AuthRequest, res: Response) {
    const data = createSchema.parse(req.body) as CreateCategoryInput
    return res.status(201).json(await this.service.create(req.userId!, data))
  }

  async update(req: AuthRequest, res: Response) {
    const data = createSchema.partial().parse(req.body)
    return res.json(await this.service.update(req.userId!, req.params.id, data))
  }

  async destroy(req: AuthRequest, res: Response) {
    await this.service.delete(req.userId!, req.params.id)
    return res.status(204).send()
  }
}

const router = Router()
const controller = new CategoryController()

router.use(authMiddleware)
router.get('/', (req, res) => controller.index(req as AuthRequest, res))
router.post('/', (req, res) => controller.store(req as AuthRequest, res))
router.put('/:id', (req, res) => controller.update(req as AuthRequest, res))
router.delete('/:id', (req, res) => controller.destroy(req as AuthRequest, res))

export { router as categoryRoutes }
