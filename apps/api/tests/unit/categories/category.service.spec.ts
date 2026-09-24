import { CategoryService } from '../../../src/modules/categories/category.service'
import { Category } from '../../../src/modules/categories/category.entity'
import { Transaction } from '../../../src/modules/transactions/transaction.entity'
import { makeCategory, makeRepository } from '../../helpers/factories'

jest.mock('../../../src/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}))

import { AppDataSource } from '../../../src/config/database'

const USER_ID = 'user-uuid-1'

describe('CategoryService', () => {
  let service: CategoryService
  let categoryRepo: ReturnType<typeof makeRepository>
  let transactionRepo: ReturnType<typeof makeRepository>

  beforeEach(() => {
    categoryRepo = makeRepository()
    transactionRepo = makeRepository()

    ;(AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Category) return categoryRepo
      if (entity === Transaction) return transactionRepo
      throw new Error(`Unexpected repository: ${entity?.name}`)
    })

    service = new CategoryService()
  })

  describe('findAll', () => {
    it('deve buscar apenas categorias do usuario', async () => {
      const categories = [makeCategory(), makeCategory({ id: 'cat-2', name: 'Transporte' })]
      categoryRepo.findBy.mockResolvedValue(categories)

      const result = await service.findAll(USER_ID)

      expect(categoryRepo.findBy).toHaveBeenCalledWith({ userId: USER_ID })
      expect(result).toBe(categories)
    })
  })

  describe('create', () => {
    it('deve criar categoria vinculada ao usuario', async () => {
      const input = { name: 'Salário', color: '#3b82f6', icon: 'briefcase', type: 'income' as const }
      const category = makeCategory({ ...input })
      categoryRepo.create.mockReturnValue(category)
      categoryRepo.save.mockResolvedValue(category)

      const result = await service.create(USER_ID, input)

      expect(categoryRepo.create).toHaveBeenCalledWith({ ...input, userId: USER_ID })
      expect(categoryRepo.save).toHaveBeenCalledWith(category)
      expect(result).toBe(category)
    })
  })

  describe('update', () => {
    it('deve atualizar somente a categoria do usuario', async () => {
      const category = makeCategory({ name: 'Mercado', color: '#000000' })
      categoryRepo.findOneBy.mockResolvedValue(category)
      categoryRepo.save.mockImplementation(async (data) => data)

      const result = await service.update(USER_ID, category.id, { name: 'Supermercado' })

      expect(categoryRepo.findOneBy).toHaveBeenCalledWith({ id: category.id, userId: USER_ID })
      expect(result).toMatchObject({ name: 'Supermercado', color: '#000000' })
    })

    it('deve lancar 404 sem salvar quando a categoria nao pertence ao usuario', async () => {
      categoryRepo.findOneBy.mockResolvedValue(null)

      await expect(service.update(USER_ID, 'category-de-outro-usuario', { name: 'x' }))
        .rejects.toMatchObject({ statusCode: 404, message: 'Categoria não encontrada' })

      expect(categoryRepo.findOneBy).toHaveBeenCalledWith({ id: 'category-de-outro-usuario', userId: USER_ID })
      expect(categoryRepo.save).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('deve desvincular as transacoes do usuario antes de remover a categoria', async () => {
      const category = makeCategory()
      categoryRepo.findOneBy.mockResolvedValue(category)

      await service.delete(USER_ID, category.id)

      expect(categoryRepo.findOneBy).toHaveBeenCalledWith({ id: category.id, userId: USER_ID })
      expect(transactionRepo.update).toHaveBeenCalledWith(
        { userId: USER_ID, categoryId: category.id },
        { categoryId: null }
      )
      expect(categoryRepo.remove).toHaveBeenCalledWith(category)
      expect(transactionRepo.update.mock.invocationCallOrder[0])
        .toBeLessThan(categoryRepo.remove.mock.invocationCallOrder[0])
    })

    it('deve lancar 404 sem alterar transacoes quando a categoria nao existe', async () => {
      categoryRepo.findOneBy.mockResolvedValue(null)

      await expect(service.delete(USER_ID, 'id-inexistente'))
        .rejects.toMatchObject({ statusCode: 404, message: 'Categoria não encontrada' })

      expect(transactionRepo.update).not.toHaveBeenCalled()
      expect(categoryRepo.remove).not.toHaveBeenCalled()
    })
  })
})
