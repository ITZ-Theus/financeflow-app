import { AppDataSource } from '../../config/database'
import { Transaction } from './transaction.entity'
import { AppError } from '../../shared/errors/AppError'
import { getPaginationParams, PaginatedResult } from '../../shared/utils/pagination'

interface CreateTransactionDTO {
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

type TransactionQuery = {
  month?: string | number
  year?: string | number
  type?: 'income' | 'expense'
  categoryId?: string
}

export interface MonthlyTrendItem {
  month: number
  year: number
  income: number
  expense: number
  balance: number
}

function getMonthRange(query: any) {
  const month = Number(query.month)
  const year = Number(query.year)

  if (!month || !year || month < 1 || month > 12) {
    return null
  }

  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function getCurrentMonth() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

function addMonths(month: number, year: number, amount: number) {
  const date = new Date(Date.UTC(year, month - 1 + amount, 1))
  return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() }
}

function getTrendPeriods(months: number, end = getCurrentMonth()) {
  return Array.from({ length: months }, (_, index) => addMonths(end.month, end.year, index - months + 1))
}

function escapeCsv(value: string | number | null | undefined): string {
  const normalized = String(value ?? '').replace(/\r?\n/g, ' ')
  return `"${normalized.replace(/"/g, '""')}"`
}

function formatCsvAmount(value: number | string): string {
  return Number(value).toFixed(2).replace('.', ',')
}

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getLastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

function addMonthsClamped(date: string, monthsToAdd: number): string {
  const base = parseDateOnly(date)
  const targetMonth = base.getUTCMonth() + monthsToAdd
  const targetYear = base.getUTCFullYear() + Math.floor(targetMonth / 12)
  const normalizedMonth = ((targetMonth % 12) + 12) % 12
  const day = Math.min(base.getUTCDate(), getLastDayOfMonth(targetYear, normalizedMonth))

  return formatDateOnly(new Date(Date.UTC(targetYear, normalizedMonth, day)))
}

function countMonthlyOccurrences(startDate: string, endDate: string): number {
  let count = 0
  let nextDate = addMonthsClamped(startDate, 1)

  while (nextDate <= endDate) {
    count += 1
    nextDate = addMonthsClamped(startDate, count + 1)
  }

  return count
}

export class TransactionService {
  private repo = AppDataSource.getRepository(Transaction)

  private buildFilteredQuery(userId: string, query: TransactionQuery = {}) {
    const qb = this.repo.createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .where('t.userId = :userId', { userId })

    if (query.type)       qb.andWhere('t.type = :type', { type: query.type })
    if (query.categoryId) qb.andWhere('t.categoryId = :categoryId', { categoryId: query.categoryId })
    const range = getMonthRange(query)
    if (range) {
      qb.andWhere('t.date >= :startDate AND t.date < :endDate', range)
    }

    return qb
  }

  async findAll(userId: string, query: any): Promise<PaginatedResult<Transaction>> {
    const { page, limit } = getPaginationParams(query)
    const qb = this.buildFilteredQuery(userId, query)

    qb.orderBy('t.date', 'DESC').skip((page - 1) * limit).take(limit)
    const [data, total] = await qb.getManyAndCount()
    return { data, total, page, totalPages: Math.ceil(total / limit) }
  }

  async summary(userId: string, query: any) {
    const qb = this.buildFilteredQuery(userId, query)

    const transactions = await qb.getMany()
    const income  = roundMoney(transactions.filter(t => t.type === 'income').reduce((s, t)  => s + Number(t.amount), 0))
    const expense = roundMoney(transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0))
    const expensesByCategory = Array.from(
      transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const key = t.categoryId || 'uncategorized'
          const current = acc.get(key) || {
            categoryId: t.categoryId || null,
            name: t.category?.name || 'Sem categoria',
            color: t.category?.color || '#64748b',
            value: 0,
          }

          current.value = roundMoney(current.value + Number(t.amount))
          acc.set(key, current)
          return acc
        }, new Map<string, { categoryId: string | null; name: string; color: string; value: number }>())
        .values()
    )

    return { income, expense, balance: roundMoney(income - expense), expensesByCategory }
  }

  async monthlyTrend(userId: string, query: { months?: string | number } = {}): Promise<MonthlyTrendItem[]> {
    const requestedMonths = Number(query.months || 6)
    const months = Number.isFinite(requestedMonths)
      ? Math.min(Math.max(Math.floor(requestedMonths), 1), 12)
      : 6
    const periods = getTrendPeriods(months)
    const first = periods[0]
    const last = periods[periods.length - 1]
    const startDate = new Date(Date.UTC(first.year, first.month - 1, 1)).toISOString().slice(0, 10)
    const endDate = new Date(Date.UTC(last.year, last.month, 1)).toISOString().slice(0, 10)

    const transactions = await this.repo.createQueryBuilder('t')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date >= :startDate AND t.date < :endDate', { startDate, endDate })
      .getMany()

    return periods.map((period) => {
      const monthTransactions = transactions.filter((transaction) => {
        const date = parseDateOnly(transaction.date)
        return date.getUTCMonth() + 1 === period.month && date.getUTCFullYear() === period.year
      })
      const income = roundMoney(monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0))
      const expense = roundMoney(monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0))

      return {
        ...period,
        income,
        expense,
        balance: roundMoney(income - expense),
      }
    })
  }

  async exportCsv(userId: string, query: TransactionQuery = {}): Promise<string> {
    const transactions = await this.buildFilteredQuery(userId, query)
      .orderBy('t.date', 'DESC')
      .addOrderBy('t.createdAt', 'DESC')
      .getMany()

    const header = ['Data', 'Tipo', 'Titulo', 'Categoria', 'Descricao', 'Valor'].map(escapeCsv).join(';')
    const rows = transactions.map((transaction) => [
      transaction.date,
      transaction.type === 'income' ? 'Entrada' : 'Saida',
      transaction.title,
      transaction.category?.name || 'Sem categoria',
      transaction.description || '',
      formatCsvAmount(transaction.amount),
    ].map(escapeCsv).join(';'))

    return ['\ufeff' + header, ...rows].join('\n')
  }

  async create(userId: string, data: CreateTransactionDTO): Promise<Transaction> {
    if (!data.isRecurring) {
      const transaction = this.repo.create({
        ...data,
        isRecurring: false,
        recurrenceInterval: null,
        recurrenceEndDate: null,
        parentTransactionId: null,
        userId,
      })
      return this.repo.save(transaction)
    }

    if (!data.recurrenceEndDate) {
      throw new AppError('Data final da recorrencia e obrigatoria', 400)
    }

    if (data.recurrenceEndDate < data.date) {
      throw new AppError('Data final da recorrencia deve ser posterior a data inicial', 400)
    }

    const occurrences = countMonthlyOccurrences(data.date, data.recurrenceEndDate)
    if (occurrences > 60) {
      throw new AppError('Recorrencia limitada a 60 meses', 400)
    }

    const parent = await this.repo.save(this.repo.create({
      ...data,
      isRecurring: true,
      recurrenceInterval: 'monthly',
      userId,
      parentTransactionId: null,
    }))

    if (occurrences > 0) {
      const generated = Array.from({ length: occurrences }, (_, index) => this.repo.create({
        ...data,
        date: addMonthsClamped(data.date, index + 1),
        isRecurring: true,
        recurrenceInterval: 'monthly',
        recurrenceEndDate: data.recurrenceEndDate,
        parentTransactionId: parent.id,
        userId,
      }))

      await this.repo.save(generated)
    }

    return parent
  }

  async update(userId: string, id: string, data: Partial<CreateTransactionDTO>): Promise<Transaction> {
    const transaction = await this.repo.findOneBy({ id, userId })
    if (!transaction) throw new AppError('Transação não encontrada', 404)
    Object.assign(transaction, data)
    return this.repo.save(transaction)
  }

  async delete(userId: string, id: string): Promise<void> {
    const transaction = await this.repo.findOneBy({ id, userId })
    if (!transaction) throw new AppError('Transação não encontrada', 404)
    await this.repo.remove(transaction)
  }
}
