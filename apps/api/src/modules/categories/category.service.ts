import { AppDataSource } from '../../config/database'
import { Category } from './category.entity'
import { Transaction } from '../transactions/transaction.entity'
import { AppError } from '../../shared/errors/AppError'

export class CategoryService {
  private repo = AppDataSource.getRepository(Category)

  async findAll(userId: string) {
    return this.repo.findBy({ userId })
  }

  async create(userId: string, data: { name: string; color?: string; icon?: string; type: 'income' | 'expense' }) {
    const category = this.repo.create({ ...data, userId })
    return this.repo.save(category)
  }

  async update(userId: string, id: string, data: Partial<{ name: string; color: string; icon: string; type: 'income' | 'expense' }>) {
    const category = await this.repo.findOneBy({ id, userId })
    if (!category) throw new AppError('Categoria não encontrada', 404)
    Object.assign(category, data)
    return this.repo.save(category)
  }

  async delete(userId: string, id: string) {
    const category = await this.repo.findOneBy({ id, userId })
    if (!category) throw new AppError('Categoria não encontrada', 404)

    await AppDataSource.getRepository(Transaction).update(
      { userId, categoryId: id },
      { categoryId: null }
    )

    await this.repo.remove(category)
  }
}
