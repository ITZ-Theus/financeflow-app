import { AppDataSource } from '../../config/database'
import { AppError } from '../../shared/errors/AppError'
import { Budget } from './budget.entity'
import { Category } from '../categories/category.entity'
import { Transaction } from '../transactions/transaction.entity'

export interface BudgetDTO {
  amount: number
  month: number
  year: number
  categoryId: string
}

export interface BudgetProgress {
  id: string
  amount: number
  spent: number
  remaining: number
  percentage: number
  status: 'safe' | 'warning' | 'exceeded'
  month: number
  year: number
  categoryId: string
  userId: string
  category: Category
  createdAt?: Date
  updatedAt?: Date
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function getCurrentBudgetPeriod() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

function getMonthRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

function getStatus(percentage: number): BudgetProgress['status'] {
  if (percentage >= 100) return 'exceeded'
  if (percentage >= 80) return 'warning'
  return 'safe'
}

export class BudgetService {
  private budgetRepo = AppDataSource.getRepository(Budget)
  private categoryRepo = AppDataSource.getRepository(Category)
  private transactionRepo = AppDataSource.getRepository(Transaction)

  async findAll(userId: string, query: { month?: string | number; year?: string | number } = {}): Promise<BudgetProgress[]> {
    const fallback = getCurrentBudgetPeriod()
    const month = Number(query.month || fallback.month)
    const year = Number(query.year || fallback.year)

    const budgets = await this.budgetRepo.find({
      where: { userId, month, year },
      relations: ['category'],
      order: { createdAt: 'ASC' },
    })

    return Promise.all(budgets.map((budget) => this.toProgress(budget)))
  }

  async create(userId: string, data: BudgetDTO): Promise<BudgetProgress> {
    const category = await this.getExpenseCategory(userId, data.categoryId)
    await this.ensureUniqueBudget(userId, data.categoryId, data.month, data.year)

    const budget = this.budgetRepo.create({ ...data, userId, category })
    const saved = await this.budgetRepo.save(budget)
    return this.toProgress({ ...saved, category })
  }

  async update(userId: string, id: string, data: Partial<BudgetDTO>): Promise<BudgetProgress> {
    const budget = await this.budgetRepo.findOne({
      where: { id, userId },
      relations: ['category'],
    })

    if (!budget) throw new AppError('Orcamento nao encontrado', 404)

    const nextCategoryId = data.categoryId || budget.categoryId
    const nextMonth = data.month || budget.month
    const nextYear = data.year || budget.year

    const category = await this.getExpenseCategory(userId, nextCategoryId)

    if (
      nextCategoryId !== budget.categoryId ||
      nextMonth !== budget.month ||
      nextYear !== budget.year
    ) {
      await this.ensureUniqueBudget(userId, nextCategoryId, nextMonth, nextYear, id)
    }

    Object.assign(budget, data, {
      categoryId: nextCategoryId,
      month: nextMonth,
      year: nextYear,
      category,
    })

    const saved = await this.budgetRepo.save(budget)
    return this.toProgress({ ...saved, category })
  }

  async delete(userId: string, id: string): Promise<void> {
    const budget = await this.budgetRepo.findOneBy({ id, userId })
    if (!budget) throw new AppError('Orcamento nao encontrado', 404)
    await this.budgetRepo.remove(budget)
  }

  private async getExpenseCategory(userId: string, categoryId: string): Promise<Category> {
    const category = await this.categoryRepo.findOneBy({ id: categoryId, userId })

    if (!category) throw new AppError('Categoria nao encontrada', 404)
    if (category.type !== 'expense') {
      throw new AppError('Orcamentos so podem ser vinculados a categorias de saida', 400)
    }

    return category
  }

  private async ensureUniqueBudget(
    userId: string,
    categoryId: string,
    month: number,
    year: number,
    ignoreId?: string
  ) {
    const existing = await this.budgetRepo.findOneBy({ userId, categoryId, month, year })

    if (existing && existing.id !== ignoreId) {
      throw new AppError('Ja existe um orcamento para esta categoria neste mes', 400)
    }
  }

  private async toProgress(budget: Budget): Promise<BudgetProgress> {
    const range = getMonthRange(budget.month, budget.year)
    const transactions = await this.transactionRepo.findBy({
      userId: budget.userId,
      categoryId: budget.categoryId,
      type: 'expense',
    })

    const spent = roundMoney(transactions
      .filter((transaction) => transaction.date >= range.startDate && transaction.date < range.endDate)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0))

    const amount = Number(budget.amount)
    const remaining = roundMoney(amount - spent)
    const percentage = amount > 0 ? roundMoney((spent / amount) * 100) : 0

    return {
      id: budget.id,
      amount,
      spent,
      remaining,
      percentage,
      status: getStatus(percentage),
      month: budget.month,
      year: budget.year,
      categoryId: budget.categoryId,
      userId: budget.userId,
      category: budget.category,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    }
  }
}
