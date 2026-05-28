import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../helpers/app'
import { ReportService } from '../../src/modules/reports/report.service'

jest.mock('../../src/modules/reports/report.service')
jest.mock('../../src/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}))

import { AppDataSource } from '../../src/config/database'

const app = createApp()
const MockedService = ReportService as jest.MockedClass<typeof ReportService>

function makeToken(userId = 'user-uuid-1') {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui', { expiresIn: '1h' })
}

describe('Report Routes - /api/reports', () => {
  beforeEach(() => {
    MockedService.mockClear()
    ;(AppDataSource.getRepository as jest.Mock).mockReturnValue({
      findOne: jest.fn().mockResolvedValue({ id: 'user-uuid-1' }),
    })
  })

  describe('GET /api/reports/financial', () => {
    it('deve retornar 401 sem token', async () => {
      const res = await request(app).get('/api/reports/financial')
      expect(res.status).toBe(401)
    })

    it('deve retornar relatorio financeiro com token valido', async () => {
      MockedService.prototype.financial.mockResolvedValue({
        period: { startDate: '2026-01-01', endDate: '2026-01-31' },
        totals: {
          income: 5000,
          expense: 1800,
          balance: 3200,
          transactionCount: 4,
          averageTransaction: 1700,
          savingsRate: 64,
        },
        monthly: [{ month: 1, year: 2026, income: 5000, expense: 1800, balance: 3200 }],
        categories: [],
        topTransactions: [],
      })

      const res = await request(app)
        .get('/api/reports/financial?startDate=2026-01-01&endDate=2026-01-31&type=expense')
        .set('Authorization', `Bearer ${makeToken()}`)

      expect(res.status).toBe(200)
      expect(res.body.totals.balance).toBe(3200)
      expect(MockedService.prototype.financial).toHaveBeenCalledWith(
        'user-uuid-1',
        expect.objectContaining({
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          type: 'expense',
        })
      )
    })

    it('deve retornar 422 para tipo invalido', async () => {
      const res = await request(app)
        .get('/api/reports/financial?type=invalid')
        .set('Authorization', `Bearer ${makeToken()}`)

      expect(res.status).toBe(422)
    })
  })
})
