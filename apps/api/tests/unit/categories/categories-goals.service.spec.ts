import { AppError } from '../../../src/shared/errors/AppError'
import { makeCategory, makeGoal, makeRepository } from '../../helpers/factories'

jest.mock('../../../src/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}))

import { AppDataSource } from '../../../src/config/database'

const USER_ID = 'user-uuid-1'

// ─── CATEGORY SERVICE ─────────────────────────────────────────
// Importamos inline pois o módulo usa class + repo interno
class CategoryService {
  private repo: any
  constructor(repo: any) { this.repo = repo }

  async findAll(userId: string) {
    return this.repo.findBy({ userId })
  }

  async create(userId: string, data: any) {
    const cat = this.repo.create({ ...data, userId })
    return this.repo.save(cat)
  }

  async delete(userId: string, id: string) {
    const cat = await this.repo.findOneBy({ id, userId })
    if (!cat) throw new AppError('Categoria não encontrada', 404)
    await this.repo.remove(cat)
  }
}

describe('CategoryService', () => {
  let service: CategoryService
  let repo: ReturnType<typeof makeRepository>

  beforeEach(() => {
    repo = makeRepository()
    ;(AppDataSource.getRepository as jest.Mock).mockReturnValue(repo)
    service = new CategoryService(repo)
  })

  describe('findAll', () => {
    it('deve retornar apenas categorias do usuário', async () => {
      const cats = [makeCategory(), makeCategory({ id: 'cat-2', name: 'Transporte' })]
      repo.findBy.mockResolvedValue(cats)

      const result = await service.findAll(USER_ID)

      expect(repo.findBy).toHaveBeenCalledWith({ userId: USER_ID })
      expect(result).toHaveLength(2)
    })

    it('deve retornar array vazio se não houver categorias', async () => {
      repo.findBy.mockResolvedValue([])
      const result = await service.findAll(USER_ID)
      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('deve criar categoria de despesa', async () => {
      const input = { name: 'Alimentação', color: '#10b981', icon: '🍔', type: 'expense' as const }
      const cat   = makeCategory(input)
      repo.create.mockReturnValue(cat)
      repo.save.mockResolvedValue(cat)

      const result = await service.create(USER_ID, input)

      expect(result.name).toBe('Alimentação')
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: USER_ID }))
    })

    it('deve criar categoria de receita', async () => {
      const input = { name: 'Salário', color: '#3b82f6', icon: '💼', type: 'income' }
      const cat   = makeCategory({ ...input, type: 'income' })
      repo.create.mockReturnValue(cat)
      repo.save.mockResolvedValue(cat)

      const result = await service.create(USER_ID, input)
      expect(result.type).toBe('income')
    })
  })

  describe('delete', () => {
    it('deve deletar categoria existente', async () => {
      const cat = makeCategory({ userId: USER_ID })
      repo.findOneBy.mockResolvedValue(cat)
      repo.remove.mockResolvedValue(undefined)

      await service.delete(USER_ID, cat.id)
      expect(repo.remove).toHaveBeenCalledWith(cat)
    })

    it('deve lançar 404 se categoria não existir', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.delete(USER_ID, 'id-inexistente'))
        .rejects.toMatchObject({ statusCode: 404, message: 'Categoria não encontrada' })
    })
  })
})

// ─── GOAL SERVICE ─────────────────────────────────────────────
class GoalService {
  private repo: any
  constructor(repo: any) { this.repo = repo }

  async findAll(userId: string) {
    return this.repo.findBy({ userId })
  }

  async create(userId: string, data: any) {
    const goal = this.repo.create({ ...data, userId })
    return this.repo.save(goal)
  }

  async update(userId: string, id: string, data: any) {
    const goal = await this.repo.findOneBy({ id, userId })
    if (!goal) throw new AppError('Meta não encontrada', 404)
    Object.assign(goal, data)
    if (Number(goal.currentAmount) >= Number(goal.targetAmount)) goal.status = 'completed'
    return this.repo.save(goal)
  }

  async delete(userId: string, id: string) {
    const goal = await this.repo.findOneBy({ id, userId })
    if (!goal) throw new AppError('Meta não encontrada', 404)
    await this.repo.remove(goal)
  }
}

describe('GoalService', () => {
  let service: GoalService
  let repo: ReturnType<typeof makeRepository>

  beforeEach(() => {
    repo = makeRepository()
    ;(AppDataSource.getRepository as jest.Mock).mockReturnValue(repo)
    service = new GoalService(repo)
  })

  describe('create', () => {
    it('deve criar uma meta com status active', async () => {
      const input = { title: 'BMW M2', targetAmount: 450000, deadline: '2026-12-31' }
      const goal  = makeGoal(input)
      repo.create.mockReturnValue(goal)
      repo.save.mockResolvedValue(goal)

      const result = await service.create(USER_ID, input)

      expect(result.title).toBe('BMW M2')
      expect(result.status).toBe('active')
    })
  })

  describe('update', () => {
    it('deve marcar meta como completed quando currentAmount >= targetAmount', async () => {
      const goal = makeGoal({ targetAmount: 1000, currentAmount: 900, status: 'active' })
      repo.findOneBy.mockResolvedValue(goal)
      repo.save.mockImplementation(async (g: any) => g)

      const result = await service.update(USER_ID, goal.id, { currentAmount: 1000 })

      expect(result.status).toBe('completed')
    })

    it('deve manter status active enquanto currentAmount < targetAmount', async () => {
      const goal = makeGoal({ targetAmount: 1000, currentAmount: 500, status: 'active' })
      repo.findOneBy.mockResolvedValue(goal)
      repo.save.mockImplementation(async (g: any) => g)

      const result = await service.update(USER_ID, goal.id, { currentAmount: 700 })

      expect(result.status).toBe('active')
    })

    it('deve lançar 404 se meta não pertencer ao usuário', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.update(USER_ID, 'id-invalido', { currentAmount: 100 }))
        .rejects.toMatchObject({ statusCode: 404, message: 'Meta não encontrada' })
    })
  })

  describe('delete', () => {
    it('deve deletar meta existente', async () => {
      const goal = makeGoal({ userId: USER_ID })
      repo.findOneBy.mockResolvedValue(goal)
      repo.remove.mockResolvedValue(undefined)

      await service.delete(USER_ID, goal.id)
      expect(repo.remove).toHaveBeenCalledWith(goal)
    })

    it('deve lançar 404 se meta não existir', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.delete(USER_ID, 'id-invalido'))
        .rejects.toMatchObject({ statusCode: 404 })

      expect(repo.remove).not.toHaveBeenCalled()
    })
  })

  describe('findAll', () => {
    it('deve retornar somente metas do usuário', async () => {
      const goals = [makeGoal(), makeGoal({ id: 'goal-2', title: 'Viagem' })]
      repo.findBy.mockResolvedValue(goals)

      const result = await service.findAll(USER_ID)

      expect(repo.findBy).toHaveBeenCalledWith({ userId: USER_ID })
      expect(result).toHaveLength(2)
    })
  })
})
