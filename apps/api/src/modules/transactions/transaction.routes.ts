import { Response, Router } from 'express'
import { z } from 'zod'
import { TransactionService } from './transaction.service'
import { authMiddleware, AuthRequest } from '../auth/auth.middleware'
import { isoDateSchema } from '../../shared/validation/date'
import { validateIdParam } from '../../shared/validation/id'
import { MAX_MONEY_AMOUNT } from '../../shared/validation/money'

const createSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive().max(MAX_MONEY_AMOUNT),
  type: z.enum(['income', 'expense']),
  date: isoDateSchema,
  description: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceInterval: z.literal('monthly').nullable().optional(),
  recurrenceEndDate: isoDateSchema.nullable().optional(),
})

// Filters shared by the list, summary and CSV export. `limit` above 100 is clamped by getPaginationParams.
const filterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.string().uuid().optional(),
})

const trendQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(12).optional(),
})

type CreateTransactionInput = {
  title: string
  amount: number
  type: 'income' | 'expense'
  date: string
  description?: string
  categoryId?: string | null
  isRecurring?: boolean
  recurrenceInterval?: 'monthly' | null
  recurrenceEndDate?: string | null
}

class TransactionController {
  private service = new TransactionService()

  async index(req: AuthRequest, res: Response) {
    const result = await this.service.findAll(req.userId!, filterQuerySchema.parse(req.query))
    return res.json(result)
  }

  async summary(req: AuthRequest, res: Response) {
    const result = await this.service.summary(req.userId!, filterQuerySchema.parse(req.query))
    return res.json(result)
  }

  async trend(req: AuthRequest, res: Response) {
    const result = await this.service.monthlyTrend(req.userId!, trendQuerySchema.parse(req.query))
    return res.json(result)
  }

  async export(req: AuthRequest, res: Response) {
    const csv = await this.service.exportCsv(req.userId!, filterQuerySchema.parse(req.query))
    const timestamp = new Date().toISOString().slice(0, 10)

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="financeflow-transactions-${timestamp}.csv"`)
    return res.status(200).send(csv)
  }

  async store(req: AuthRequest, res: Response) {
    const data = createSchema.parse(req.body) as CreateTransactionInput
    const transaction = await this.service.create(req.userId!, data)
    return res.status(201).json(transaction)
  }

  async update(req: AuthRequest, res: Response) {
    const data = createSchema.partial().parse(req.body)
    const transaction = await this.service.update(req.userId!, req.params.id, data)
    return res.json(transaction)
  }

  async destroy(req: AuthRequest, res: Response) {
    await this.service.delete(req.userId!, req.params.id)
    return res.status(204).send()
  }
}

const router = Router()
const controller = new TransactionController()

router.use(authMiddleware)
router.param('id', validateIdParam)
router.get('/', (req, res) => controller.index(req as AuthRequest, res))
router.get('/summary', (req, res) => controller.summary(req as AuthRequest, res))
router.get('/trend', (req, res) => controller.trend(req as AuthRequest, res))
router.get('/export', (req, res) => controller.export(req as AuthRequest, res))
router.post('/', (req, res) => controller.store(req as AuthRequest, res))
router.put('/:id', (req, res) => controller.update(req as AuthRequest, res))
router.delete('/:id', (req, res) => controller.destroy(req as AuthRequest, res))

export { router as transactionRoutes }
