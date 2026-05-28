import { AppDataSource } from '../../config/database'
import { AppError } from '../../shared/errors/AppError'
import { Transaction } from '../transactions/transaction.entity'

export type ReportTransactionType = 'income' | 'expense'

export interface FinancialReportQuery {
  startDate?: string
  endDate?: string
  type?: ReportTransactionType
  categoryId?: string
}

export interface ReportMonthlyItem {
  month: number
  year: number
  income: number
  expense: number
  balance: number
}

export interface ReportCategoryItem {
  categoryId: string | null
  name: string
  color: string
  type: ReportTransactionType
  total: number
  count: number
  percentage: number
}

export interface ReportTransactionItem {
  id: string
  title: string
  amount: number
  type: ReportTransactionType
  date: string
  categoryName: string
  categoryColor: string
}

export interface FinancialReport {
  period: {
    startDate: string
    endDate: string
  }
  totals: {
    income: number
    expense: number
    balance: number
    transactionCount: number
    averageTransaction: number
    savingsRate: number
  }
  monthly: ReportMonthlyItem[]
  categories: ReportCategoryItem[]
  topTransactions: ReportTransactionItem[]
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function getDefaultPeriod() {
  const now = new Date()
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 5, 1))
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0))

  return {
    startDate: formatDateOnly(start),
    endDate: formatDateOnly(end),
  }
}

function getNormalizedPeriod(query: FinancialReportQuery) {
  const fallback = getDefaultPeriod()
  const startDate = query.startDate || fallback.startDate
  const endDate = query.endDate || fallback.endDate

  if (startDate > endDate) {
    throw new AppError('Periodo inicial deve ser anterior ao periodo final', 400)
  }

  return { startDate, endDate }
}

function getMonthPeriods(startDate: string, endDate: string) {
  const start = parseDateOnly(startDate)
  const end = parseDateOnly(endDate)
  const periods: Array<{ month: number; year: number }> = []
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1))

  while (cursor <= last) {
    periods.push({ month: cursor.getUTCMonth() + 1, year: cursor.getUTCFullYear() })
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
  }

  return periods
}

function isSameMonth(date: string, month: number, year: number): boolean {
  const parsed = parseDateOnly(date)
  return parsed.getUTCMonth() + 1 === month && parsed.getUTCFullYear() === year
}

function getCategoryKey(transaction: Transaction): string {
  return `${transaction.type}:${transaction.categoryId || 'uncategorized'}`
}

export class ReportService {
  private transactionRepo = AppDataSource.getRepository(Transaction)

  async financial(userId: string, query: FinancialReportQuery = {}): Promise<FinancialReport> {
    const period = getNormalizedPeriod(query)
    const qb = this.transactionRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date >= :startDate AND t.date <= :endDate', period)

    if (query.type) {
      qb.andWhere('t.type = :type', { type: query.type })
    }

    if (query.categoryId) {
      qb.andWhere('t.categoryId = :categoryId', { categoryId: query.categoryId })
    }

    const transactions = await qb
      .orderBy('t.date', 'ASC')
      .addOrderBy('t.createdAt', 'ASC')
      .getMany()

    const income = roundMoney(transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0))
    const expense = roundMoney(transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0))
    const volume = roundMoney(income + expense)
    const transactionCount = transactions.length

    const monthly = getMonthPeriods(period.startDate, period.endDate).map((monthPeriod) => {
      const monthTransactions = transactions.filter((transaction) => isSameMonth(transaction.date, monthPeriod.month, monthPeriod.year))
      const monthIncome = roundMoney(monthTransactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0))
      const monthExpense = roundMoney(monthTransactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0))

      return {
        ...monthPeriod,
        income: monthIncome,
        expense: monthExpense,
        balance: roundMoney(monthIncome - monthExpense),
      }
    })

    const categories = Array.from(transactions.reduce((acc, transaction) => {
      const key = getCategoryKey(transaction)
      const current = acc.get(key) || {
        categoryId: transaction.categoryId || null,
        name: transaction.category?.name || 'Sem categoria',
        color: transaction.category?.color || '#64748b',
        type: transaction.type,
        total: 0,
        count: 0,
        percentage: 0,
      }

      current.total = roundMoney(current.total + Number(transaction.amount))
      current.count += 1
      acc.set(key, current)
      return acc
    }, new Map<string, ReportCategoryItem>()).values())
      .map((category) => ({
        ...category,
        percentage: volume > 0 ? roundPercent((category.total / volume) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)

    const topTransactions = [...transactions]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5)
      .map((transaction) => ({
        id: transaction.id,
        title: transaction.title,
        amount: Number(transaction.amount),
        type: transaction.type,
        date: transaction.date,
        categoryName: transaction.category?.name || 'Sem categoria',
        categoryColor: transaction.category?.color || '#64748b',
      }))

    return {
      period,
      totals: {
        income,
        expense,
        balance: roundMoney(income - expense),
        transactionCount,
        averageTransaction: transactionCount > 0 ? roundMoney(volume / transactionCount) : 0,
        savingsRate: income > 0 ? roundPercent(((income - expense) / income) * 100) : 0,
      },
      monthly,
      categories,
      topTransactions,
    }
  }
}
