import { GoalService } from '../../../src/modules/goals/goal.service'
import { Goal } from '../../../src/modules/goals/goal.entity'
import { makeGoal, makeRepository } from '../../helpers/factories'

jest.mock('../../../src/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}))

import { AppDataSource } from '../../../src/config/database'

const USER_ID = 'user-uuid-1'

describe('GoalService', () => {
  let service: GoalService
  let repo: ReturnType<typeof makeRepository>

  beforeEach(() => {
    repo = makeRepository()
    ;(AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Goal) return repo
      throw new Error(`Unexpected repository: ${entity?.name}`)
    })
    service = new GoalService()
  })

  describe('findAll', () => {
    it('deve buscar apenas metas do usuario', async () => {
      const goals = [makeGoal(), makeGoal({ id: 'goal-2', title: 'Viagem' })]
      repo.findBy.mockResolvedValue(goals)

      const result = await service.findAll(USER_ID)

      expect(repo.findBy).toHaveBeenCalledWith({ userId: USER_ID })
      expect(result).toBe(goals)
    })
  })

  describe('create', () => {
    it('deve criar meta vinculada ao usuario', async () => {
      const input = { title: 'Reserva', targetAmount: 10000, deadline: '2026-12-31' }
      const goal = makeGoal(input)
      repo.create.mockReturnValue(goal)
      repo.save.mockResolvedValue(goal)

      const result = await service.create(USER_ID, input)

      expect(repo.create).toHaveBeenCalledWith({ ...input, userId: USER_ID })
      expect(result).toBe(goal)
    })
  })

  describe('update', () => {
    beforeEach(() => {
      repo.save.mockImplementation(async (goal) => goal)
    })

    it('deve marcar meta como completed quando currentAmount atinge targetAmount', async () => {
      repo.findOneBy.mockResolvedValue(makeGoal({ targetAmount: 1000, currentAmount: 900 }))

      const result = await service.update(USER_ID, 'goal-uuid-1', { currentAmount: 1000 })

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'goal-uuid-1', userId: USER_ID })
      expect(result.status).toBe('completed')
    })

    it('deve manter status active enquanto currentAmount < targetAmount', async () => {
      repo.findOneBy.mockResolvedValue(makeGoal({ targetAmount: 1000, currentAmount: 500 }))

      const result = await service.update(USER_ID, 'goal-uuid-1', { currentAmount: 700 })

      expect(result.status).toBe('active')
    })

    it('deve lancar 404 sem salvar quando a meta nao pertence ao usuario', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.update(USER_ID, 'goal-de-outro-usuario', { currentAmount: 100 }))
        .rejects.toMatchObject({ statusCode: 404, message: 'Meta não encontrada' })

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'goal-de-outro-usuario', userId: USER_ID })
      expect(repo.save).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('deve remover meta do usuario', async () => {
      const goal = makeGoal()
      repo.findOneBy.mockResolvedValue(goal)

      await service.delete(USER_ID, goal.id)

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: goal.id, userId: USER_ID })
      expect(repo.remove).toHaveBeenCalledWith(goal)
    })

    it('deve lancar 404 sem remover quando a meta nao existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.delete(USER_ID, 'id-inexistente'))
        .rejects.toMatchObject({ statusCode: 404 })

      expect(repo.remove).not.toHaveBeenCalled()
    })
  })
})
