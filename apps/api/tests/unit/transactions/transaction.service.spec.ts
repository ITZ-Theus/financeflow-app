import { TransactionService } from '../../../src/modules/transactions/transaction.service'
import { AppError } from '../../../src/shared/errors/AppError'
import { makeTransaction, makeRepository } from '../../helpers/factories'

jest.mock('../../../src/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}))

import { AppDataSource } from '../../../src/config/database'

const USER_ID = 'user-uuid-1'

describe('TransactionService', () => {
  let service: TransactionService
  let repo: ReturnType<typeof makeRepository>

  beforeEach(() => {
    repo = makeRepository()
    ;(AppDataSource.getRepository as jest.Mock).mockReturnValue(repo)
    service = new TransactionService()
  })

  // ─── CREATE ────────────────────────────────────────────────
  describe('create', () => {
    it('deve criar uma transação de entrada', async () => {
      const input = { title: 'Salário', amount: 5000, type: 'income' as const, date: '2024-01-15' }
      const transaction = makeTransaction({ ...input, userId: USER_ID })

      repo.create.mockReturnValue(transaction)
      repo.save.mockResolvedValue(transaction)

      const result = await service.create(USER_ID, input)

      expect(result.title).toBe('Salário')
      expect(result.type).toBe('income')
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: USER_ID }))
    })

    it('deve criar uma transação de saída', async () => {
      const input = { title: 'Aluguel', amount: 1500, type: 'expense' as const, date: '2024-01-05' }
      const transaction = makeTransaction({ ...input })

      repo.create.mockReturnValue(transaction)
      repo.save.mockResolvedValue(transaction)

      const result = await service.create(USER_ID, input)

      expect(result.type).toBe('expense')
    })

    it('deve associar categoria se categoryId for fornecido', async () => {
      const input = { title: 'Mercado', amount: 300, type: 'expense' as const, date: '2024-01-10', categoryId: 'cat-uuid-1' }
      const transaction = makeTransaction({ ...input })

      repo.create.mockReturnValue(transaction)
      repo.save.mockResolvedValue(transaction)

      await service.create(USER_ID, input)

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'cat-uuid-1' })
      )
    })

    it('deve gerar transacoes mensais quando recorrente', async () => {
      const parent = makeTransaction({
        id: 'parent-transaction',
        title: 'Assinatura',
        amount: 59.9,
        type: 'expense',
        date: '2026-01-31',
        isRecurring: true,
        recurrenceInterval: 'monthly',
        recurrenceEndDate: '2026-04-30',
      })

      repo.create.mockImplementation((data) => makeTransaction(data as any))
      repo.save
        .mockResolvedValueOnce(parent)
        .mockResolvedValueOnce([])

      const result = await service.create(USER_ID, {
        title: 'Assinatura',
        amount: 59.9,
        type: 'expense',
        date: '2026-01-31',
        isRecurring: true,
        recurrenceEndDate: '2026-04-30',
      })

      const generated = repo.save.mock.calls[1][0]

      expect(result.id).toBe('parent-transaction')
      expect(generated).toHaveLength(3)
      expect(generated.map((transaction: any) => transaction.date)).toEqual([
        '2026-02-28',
        '2026-03-31',
        '2026-04-30',
      ])
      expect(generated.every((transaction: any) => transaction.parentTransactionId === parent.id)).toBe(true)
    })

    it('deve exigir data final para recorrencia', async () => {
      await expect(service.create(USER_ID, {
        title: 'Aluguel',
        amount: 2000,
        type: 'expense',
        date: '2026-01-05',
        isRecurring: true,
      })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Data final da recorrencia e obrigatoria',
      })
    })

    it('deve rejeitar recorrencia com data final antes da inicial', async () => {
      await expect(service.create(USER_ID, {
        title: 'Aluguel',
        amount: 2000,
        type: 'expense',
        date: '2026-02-05',
        isRecurring: true,
        recurrenceEndDate: '2026-01-05',
      })).rejects.toMatchObject({
        statusCode: 400,
      })
    })
  })

  // ─── UPDATE ────────────────────────────────────────────────
  describe('update', () => {
    it('deve atualizar título e valor de uma transação existente', async () => {
      const existing = makeTransaction({ userId: USER_ID })
      repo.findOneBy.mockResolvedValue(existing)
      repo.save.mockResolvedValue({ ...existing, title: 'Salário Atualizado', amount: 6000 })

      const result = await service.update(USER_ID, existing.id, { title: 'Salário Atualizado', amount: 6000 })

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: existing.id, userId: USER_ID })
      expect(repo.save).toHaveBeenCalled()
    })

    it('deve lançar AppError 404 se transação não pertencer ao usuário', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(
        service.update(USER_ID, 'id-inexistente', { title: 'Novo título' })
      ).rejects.toMatchObject({ statusCode: 404, message: 'Transação não encontrada' })
    })
  })

  // ─── DELETE ────────────────────────────────────────────────
  describe('delete', () => {
    it('deve deletar uma transação existente', async () => {
      const transaction = makeTransaction({ userId: USER_ID })
      repo.findOneBy.mockResolvedValue(transaction)
      repo.remove.mockResolvedValue(undefined)

      await service.delete(USER_ID, transaction.id)

      expect(repo.remove).toHaveBeenCalledWith(transaction)
    })

    it('deve lançar AppError 404 se transação não for encontrada', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(
        service.delete(USER_ID, 'id-inexistente')
      ).rejects.toMatchObject({ statusCode: 404 })
    })

    it('não deve permitir deletar transação de outro usuário', async () => {
      // findOneBy com userId errado retorna null
      repo.findOneBy.mockResolvedValue(null)

      await expect(
        service.delete('outro-user-id', 'transaction-uuid-1')
      ).rejects.toBeInstanceOf(AppError)

      expect(repo.remove).not.toHaveBeenCalled()
    })
  })

  // ─── SUMMARY ───────────────────────────────────────────────
  describe('summary', () => {
    it('deve calcular corretamente income, expense e balance', async () => {
      const transactions = [
        makeTransaction({ type: 'income',  amount: 5000 }),
        makeTransaction({ type: 'income',  amount: 2000 }),
        makeTransaction({ type: 'expense', amount: 1500 }),
        makeTransaction({ type: 'expense', amount: 800  }),
      ]

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(transactions),
      }
      repo.createQueryBuilder.mockReturnValue(qb)

      const result = await service.summary(USER_ID, {})

      expect(result.income).toBe(7000)
      expect(result.expense).toBe(2300)
      expect(result.balance).toBe(4700)
      expect(result.expensesByCategory).toEqual([
        { categoryId: null, name: 'Sem categoria', color: '#64748b', value: 2300 },
      ])
    })

    it('deve retornar saldo negativo quando despesas superam receitas', async () => {
      const transactions = [
        makeTransaction({ type: 'income',  amount: 1000 }),
        makeTransaction({ type: 'expense', amount: 3000 }),
      ]

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(transactions),
      }
      repo.createQueryBuilder.mockReturnValue(qb)

      const result = await service.summary(USER_ID, {})

      expect(result.balance).toBe(-2000)
    })

    it('deve retornar zeros quando não há transações', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }
      repo.createQueryBuilder.mockReturnValue(qb)

      const result = await service.summary(USER_ID, {})

      expect(result).toEqual({ income: 0, expense: 0, balance: 0, expensesByCategory: [] })
    })

    it('deve agrupar despesas por categoria para a dashboard', async () => {
      const transactions = [
        makeTransaction({
          type: 'expense',
          amount: 100,
          categoryId: 'cat-health',
          category: { id: 'cat-health', name: 'Saude', color: '#10b981' } as any,
        }),
        makeTransaction({
          type: 'expense',
          amount: 250,
          categoryId: 'cat-health',
          category: { id: 'cat-health', name: 'Saude', color: '#10b981' } as any,
        }),
        makeTransaction({
          type: 'expense',
          amount: 80,
          categoryId: 'cat-food',
          category: { id: 'cat-food', name: 'Alimentacao', color: '#f59e0b' } as any,
        }),
      ]

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(transactions),
      }
      repo.createQueryBuilder.mockReturnValue(qb)

      const result = await service.summary(USER_ID, {})

      expect(result.expensesByCategory).toEqual([
        { categoryId: 'cat-health', name: 'Saude', color: '#10b981', value: 350 },
        { categoryId: 'cat-food', name: 'Alimentacao', color: '#f59e0b', value: 80 },
      ])
    })

    it('deve arredondar totais financeiros para centavos', async () => {
      const transactions = [
        makeTransaction({ type: 'income', amount: 0.1 }),
        makeTransaction({ type: 'income', amount: 0.2 }),
        makeTransaction({ type: 'expense', amount: 0.1 }),
      ]

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(transactions),
      }
      repo.createQueryBuilder.mockReturnValue(qb)

      const result = await service.summary(USER_ID, {})

      expect(result.income).toBe(0.3)
      expect(result.expense).toBe(0.1)
      expect(result.balance).toBe(0.2)
    })
  })

  // ─── FIND ALL ──────────────────────────────────────────────
  describe('findAll', () => {
    it('deve retornar lista paginada de transações', async () => {
      const transactions = [makeTransaction(), makeTransaction({ id: 'uuid-2' })]

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([transactions, 2]),
      }
      repo.createQueryBuilder.mockReturnValue(qb)

      const result = await service.findAll(USER_ID, { page: 1, limit: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(1)
    })
  })

  describe('exportCsv', () => {
    it('deve exportar transacoes filtradas em CSV', async () => {
      const transactions = [
        makeTransaction({
          title: 'Mercado "Central"',
          type: 'expense',
          amount: 123.45,
          date: '2026-05-01',
          description: 'Compra do mes',
          categoryId: 'cat-food',
          category: { id: 'cat-food', name: 'Alimentacao', color: '#f59e0b' } as any,
        }),
      ]

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(transactions),
      }
      repo.createQueryBuilder.mockReturnValue(qb)

      const csv = await service.exportCsv(USER_ID, { month: 5, year: 2026 })

      expect(qb.andWhere).toHaveBeenCalledWith('t.date >= :startDate AND t.date < :endDate', {
        startDate: '2026-05-01',
        endDate: '2026-06-01',
      })
      expect(csv).toContain('"Data";"Tipo";"Titulo";"Categoria";"Descricao";"Valor"')
      expect(csv).toContain('"2026-05-01";"Saida";"Mercado ""Central""";"Alimentacao";"Compra do mes";"123,45"')
    })
  })
})
