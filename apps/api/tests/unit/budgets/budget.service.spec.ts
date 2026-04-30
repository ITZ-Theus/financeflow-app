import { BudgetService } from '../../../src/modules/budgets/budget.service'
import { Budget } from '../../../src/modules/budgets/budget.entity'
import { Category } from '../../../src/modules/categories/category.entity'
import { Transaction } from '../../../src/modules/transactions/transaction.entity'
import { AppError } from '../../../src/shared/errors/AppError'
import { makeBudget, makeCategory, makeRepository, makeTransaction } from '../../helpers/factories'

jest.mock('../../../src/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}))

import { AppDataSource } from '../../../src/config/database'

const USER_ID = 'user-uuid-1'

describe('BudgetService', () => {
  let service: BudgetService
  let budgetRepo: ReturnType<typeof makeRepository>
  let categoryRepo: ReturnType<typeof makeRepository>
  let transactionRepo: ReturnType<typeof makeRepository>

  beforeEach(() => {
    budgetRepo = makeRepository()
    categoryRepo = makeRepository()
    transactionRepo = makeRepository()

    ;(AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Budget) return budgetRepo
      if (entity === Category) return categoryRepo
      if (entity === Transaction) return transactionRepo
      return makeRepository()
    })

    service = new BudgetService()
  })

  describe('findAll', () => {
    it('retorna orcamentos com progresso mensal calculado', async () => {
      const category = makeCategory({ id: 'cat-food', name: 'Alimentacao' })
      const budget = makeBudget({ amount: 1000, categoryId: category.id, category })

      budgetRepo.find.mockResolvedValue([budget])
      transactionRepo.findBy.mockResolvedValue([
        makeTransaction({ type: 'expense', amount: 250, categoryId: category.id, date: '2026-01-10' }),
        makeTransaction({ type: 'expense', amount: 125.5, categoryId: category.id, date: '2026-01-20' }),
        makeTransaction({ type: 'expense', amount: 999, categoryId: category.id, date: '2026-02-01' }),
      ])

      const result = await service.findAll(USER_ID, { month: 1, year: 2026 })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        amount: 1000,
        spent: 375.5,
        remaining: 624.5,
        percentage: 37.55,
        status: 'safe',
        categoryId: category.id,
      })
    })

    it('marca orcamento como warning a partir de 80 por cento', async () => {
      const budget = makeBudget({ amount: 1000 })

      budgetRepo.find.mockResolvedValue([budget])
      transactionRepo.findBy.mockResolvedValue([
        makeTransaction({ type: 'expense', amount: 850, categoryId: budget.categoryId, date: '2026-01-15' }),
      ])

      const [result] = await service.findAll(USER_ID, { month: 1, year: 2026 })

      expect(result.status).toBe('warning')
      expect(result.percentage).toBe(85)
    })

    it('marca orcamento como exceeded quando ultrapassa o limite', async () => {
      const budget = makeBudget({ amount: 1000 })

      budgetRepo.find.mockResolvedValue([budget])
      transactionRepo.findBy.mockResolvedValue([
        makeTransaction({ type: 'expense', amount: 1200, categoryId: budget.categoryId, date: '2026-01-15' }),
      ])

      const [result] = await service.findAll(USER_ID, { month: 1, year: 2026 })

      expect(result.status).toBe('exceeded')
      expect(result.remaining).toBe(-200)
    })
  })

  describe('create', () => {
    it('cria orcamento para categoria de saida do usuario', async () => {
      const category = makeCategory({ type: 'expense' })
      const budget = makeBudget({ categoryId: category.id, category })

      categoryRepo.findOneBy.mockResolvedValue(category)
      budgetRepo.findOneBy.mockResolvedValue(null)
      budgetRepo.create.mockReturnValue(budget)
      budgetRepo.save.mockResolvedValue(budget)
      transactionRepo.findBy.mockResolvedValue([])

      const result = await service.create(USER_ID, {
        amount: 800,
        month: 1,
        year: 2026,
        categoryId: category.id,
      })

      expect(budgetRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: USER_ID,
        categoryId: category.id,
      }))
      expect(result.spent).toBe(0)
    })

    it('nao permite categoria de entrada', async () => {
      categoryRepo.findOneBy.mockResolvedValue(makeCategory({ type: 'income' }))

      await expect(service.create(USER_ID, {
        amount: 800,
        month: 1,
        year: 2026,
        categoryId: 'category-uuid-1',
      })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Orcamentos so podem ser vinculados a categorias de saida',
      })
    })

    it('nao permite duplicar orcamento da mesma categoria no mesmo mes', async () => {
      const category = makeCategory({ type: 'expense' })
      categoryRepo.findOneBy.mockResolvedValue(category)
      budgetRepo.findOneBy.mockResolvedValue(makeBudget({ categoryId: category.id }))

      await expect(service.create(USER_ID, {
        amount: 800,
        month: 1,
        year: 2026,
        categoryId: category.id,
      })).rejects.toBeInstanceOf(AppError)
    })
  })
})
