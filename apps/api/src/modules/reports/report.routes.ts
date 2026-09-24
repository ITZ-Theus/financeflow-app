import { Response, Router } from 'express'
import { z } from 'zod'
import { authMiddleware, AuthRequest } from '../auth/auth.middleware'
import { FinancialReportQuery, ReportService } from './report.service'
import { isoDateSchema } from '../../shared/validation/date'

const reportQuerySchema = z.object({
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional(),
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
