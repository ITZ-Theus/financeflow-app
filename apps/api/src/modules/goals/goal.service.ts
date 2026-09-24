import { AppDataSource } from '../../config/database'
import { Goal } from './goal.entity'
import { AppError } from '../../shared/errors/AppError'

export class GoalService {
  private repo = AppDataSource.getRepository(Goal)

  async findAll(userId: string) {
    return this.repo.findBy({ userId })
  }

  async create(userId: string, data: { title: string; targetAmount: number; deadline: string }) {
    const goal = this.repo.create({ ...data, userId })
    return this.repo.save(goal)
  }

  async update(userId: string, id: string, data: Partial<{ title: string; targetAmount: number; currentAmount: number; deadline: string; status: 'active' | 'completed' | 'cancelled' }>) {
    const goal = await this.repo.findOneBy({ id, userId })
    if (!goal) throw new AppError('Meta não encontrada', 404)
    Object.assign(goal, data)
    if (goal.currentAmount >= goal.targetAmount) goal.status = 'completed'
    return this.repo.save(goal)
  }

  async delete(userId: string, id: string) {
    const goal = await this.repo.findOneBy({ id, userId })
    if (!goal) throw new AppError('Meta não encontrada', 404)
    await this.repo.remove(goal)
  }
}
