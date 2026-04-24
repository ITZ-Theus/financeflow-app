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
  categoryId?: string
}

export class TransactionService {
  private repo = AppDataSource.getRepository(Transaction)

  async findAll(userId: string, query: any): Promise<PaginatedResult<Transaction>> {
    const { page, limit } = getPaginationParams(query)
    const qb = this.repo.createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .where('t.userId = :userId', { userId })

    if (query.type)       qb.andWhere('t.type = :type', { type: query.type })
    if (query.categoryId) qb.andWhere('t.categoryId = :categoryId', { categoryId: query.categoryId })
    if (query.month && query.year) {
      qb.andWhere('MONTH(t.date) = :month AND YEAR(t.date) = :year', {
        month: query.month, year: query.year,
      })
    }

    qb.orderBy('t.date', 'DESC').skip((page - 1) * limit).take(limit)
    const [data, total] = await qb.getManyAndCount()
    return { data, total, page, totalPages: Math.ceil(total / limit) }
  }

  async summary(userId: string, query: any) {
    const qb = this.repo.createQueryBuilder('t').where('t.userId = :userId', { userId })
    if (query.month && query.year) {
      qb.andWhere('MONTH(t.date) = :month AND YEAR(t.date) = :year', {
        month: query.month, year: query.year,
      })
    }
    const transactions = await qb.getMany()
    const income  = transactions.filter(t => t.type === 'income').reduce((s, t)  => s + Number(t.amount), 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    return { income, expense, balance: income - expense }
  }

  async create(userId: string, data: CreateTransactionDTO): Promise<Transaction> {
    const transaction = this.repo.create({ ...data, userId })
    return this.repo.save(transaction)
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
