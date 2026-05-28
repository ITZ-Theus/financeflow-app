import { Response, Router } from 'express'
import { z } from 'zod'
import { authMiddleware, AuthRequest } from '../auth/auth.middleware'
import { FinancialReportQuery, ReportService } from './report.service'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato YYYY-MM-DD')

const reportQuerySchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.string().uuid().optional(),
})

class ReportController {
  private service = new ReportService()

  async financial(req: AuthRequest, res: Response) {
    const query = reportQuerySchema.parse(req.query) as FinancialReportQuery
    return res.json(await this.service.financial(req.userId!, query))
  }
}

const router = Router()
const controller = new ReportController()

router.use(authMiddleware)
router.get('/financial', (req, res) => controller.financial(req as AuthRequest, res))

export { router as reportRoutes }
