import { ReportService } from '../../../src/modules/reports/report.service'
import { makeRepository, makeTransaction } from '../../helpers/factories'

jest.mock('../../../src/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}))

import { AppDataSource } from '../../../src/config/database'

const USER_ID = 'user-uuid-1'

function makeQueryBuilder(transactions: ReturnType<typeof makeTransaction>[]) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(transactions),
  }
}

describe('ReportService', () => {
  let service: ReportService
  let repo: ReturnType<typeof makeRepository>

  beforeEach(() => {
    repo = makeRepository()
    ;(AppDataSource.getRepository as jest.Mock).mockReturnValue(repo)
    service = new ReportService()
  })

  it('deve agregar totais, meses, categorias e maiores transacoes', async () => {
    const transactions = [
      makeTransaction({
        id: 'income-1',
        title: 'Salario',
        type: 'income',
        amount: 5000,
        date: '2026-01-05',
        categoryId: 'cat-income',
        category: { id: 'cat-income', name: 'Salario', color: '#10b981', type: 'income' } as any,
      }),
      makeTransaction({
        id: 'expense-1',
        title: 'Mercado',
        type: 'expense',
        amount: 700,
        date: '2026-01-12',
        categoryId: 'cat-food',
        category: { id: 'cat-food', name: 'Mercado', color: '#f59e0b', type: 'expense' } as any,
      }),
      makeTransaction({
        id: 'expense-2',
        title: 'Transporte',
        type: 'expense',
        amount: 300,
        date: '2026-02-02',
        categoryId: 'cat-transport',
        category: { id: 'cat-transport', name: 'Transporte', color: '#38bdf8', type: 'expense' } as any,
      }),
      makeTransaction({
        id: 'income-2',
        title: 'Freela',
        type: 'income',
        amount: 1000,
        date: '2026-02-20',
      }),
    ]
    const qb = makeQueryBuilder(transactions)
    repo.createQueryBuilder.mockReturnValue(qb)

    const result = await service.financial(USER_ID, {
      startDate: '2026-01-01',
      endDate: '2026-02-28',
    })

    expect(result.period).toEqual({ startDate: '2026-01-01', endDate: '2026-02-28' })
    expect(result.totals).toEqual({
      income: 6000,
      expense: 1000,
      balance: 5000,
      transactionCount: 4,
      averageTransaction: 1750,
      savingsRate: 83.33,
    })
    expect(result.monthly).toEqual([
      { month: 1, year: 2026, income: 5000, expense: 700, balance: 4300 },
      { month: 2, year: 2026, income: 1000, expense: 300, balance: 700 },
    ])
    expect(result.categories.map((category) => category.name)).toEqual([
      'Salario',
      'Sem categoria',
      'Mercado',
      'Transporte',
    ])
    expect(result.topTransactions[0]).toEqual({
      id: 'income-1',
      title: 'Salario',
      amount: 5000,
      type: 'income',
      date: '2026-01-05',
      categoryName: 'Salario',
      categoryColor: '#10b981',
    })
  })

  it('deve aplicar filtros opcionais na query', async () => {
    const qb = makeQueryBuilder([])
    repo.createQueryBuilder.mockReturnValue(qb)

    await service.financial(USER_ID, {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      type: 'expense',
      categoryId: 'category-uuid-1',
    })

    expect(qb.where).toHaveBeenCalledWith('t.userId = :userId', { userId: USER_ID })
    expect(qb.andWhere).toHaveBeenCalledWith('t.date >= :startDate AND t.date <= :endDate', {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    })
    expect(qb.andWhere).toHaveBeenCalledWith('t.type = :type', { type: 'expense' })
    expect(qb.andWhere).toHaveBeenCalledWith('t.categoryId = :categoryId', { categoryId: 'category-uuid-1' })
  })

  it('deve rejeitar periodo final anterior ao inicial', async () => {
    await expect(service.financial(USER_ID, {
      startDate: '2026-03-01',
      endDate: '2026-02-01',
    })).rejects.toMatchObject({
      statusCode: 400,
      message: 'Periodo inicial deve ser anterior ao periodo final',
    })
  })
})
