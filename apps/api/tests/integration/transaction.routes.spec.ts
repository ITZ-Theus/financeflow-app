import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../helpers/app'
import { TransactionService } from '../../src/modules/transactions/transaction.service'
import { makeTransaction } from '../helpers/factories'

jest.mock('../../src/modules/transactions/transaction.service')
jest.mock('../../src/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}))

const app = createApp()
const MockedService = TransactionService as jest.MockedClass<typeof TransactionService>

// Gera um token válido para os testes autenticados
function makeToken(userId = 'user-uuid-1') {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui', { expiresIn: '1h' })
}

describe('Transaction Routes - /api/transactions', () => {
  beforeEach(() => MockedService.mockClear())

  describe('GET /api/transactions', () => {
    it('deve retornar 401 sem token', async () => {
      const res = await request(app).get('/api/transactions')
      expect(res.status).toBe(401)
    })

    it('deve retornar lista paginada com token válido', async () => {
      const transactions = [makeTransaction(), makeTransaction({ id: 'uuid-2' })]
      MockedService.prototype.findAll.mockResolvedValue({
        data: transactions, total: 2, page: 1, totalPages: 1,
      })

      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${makeToken()}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.total).toBe(2)
    })
  })

  describe('GET /api/transactions/summary', () => {
    it('deve retornar resumo financeiro', async () => {
      MockedService.prototype.summary.mockResolvedValue({
        income: 7000, expense: 2300, balance: 4700,
      })

      const res = await request(app)
        .get('/api/transactions/summary')
        .set('Authorization', `Bearer ${makeToken()}`)

      expect(res.status).toBe(200)
      expect(res.body.income).toBe(7000)
      expect(res.body.balance).toBe(4700)
    })
  })

  describe('POST /api/transactions', () => {
    it('deve criar transação com dados válidos', async () => {
      const transaction = makeTransaction()
      MockedService.prototype.create.mockResolvedValue(transaction)

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ title: 'Salário', amount: 5000, type: 'income', date: '2024-01-15' })

      expect(res.status).toBe(201)
      expect(res.body.title).toBe('Salário')
    })

    it('deve retornar 422 se amount for negativo', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ title: 'Salário', amount: -100, type: 'income', date: '2024-01-15' })

      expect(res.status).toBe(422)
    })

    it('deve retornar 422 se type for inválido', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ title: 'Salário', amount: 5000, type: 'invalido', date: '2024-01-15' })

      expect(res.status).toBe(422)
    })

    it('deve retornar 422 se title estiver faltando', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ amount: 5000, type: 'income', date: '2024-01-15' })

      expect(res.status).toBe(422)
    })
  })

  describe('DELETE /api/transactions/:id', () => {
    it('deve deletar transação existente', async () => {
      MockedService.prototype.delete.mockResolvedValue(undefined)

      const res = await request(app)
        .delete('/api/transactions/uuid-1')
        .set('Authorization', `Bearer ${makeToken()}`)

      expect(res.status).toBe(204)
    })

    it('deve retornar 404 se transação não existir', async () => {
      const { AppError } = await import('../../src/shared/errors/AppError')
      MockedService.prototype.delete.mockRejectedValue(
        new AppError('Transação não encontrada', 404)
      )

      const res = await request(app)
        .delete('/api/transactions/id-invalido')
        .set('Authorization', `Bearer ${makeToken()}`)

      expect(res.status).toBe(404)
    })
  })
})
