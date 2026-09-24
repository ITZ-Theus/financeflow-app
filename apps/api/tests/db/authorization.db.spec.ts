import request from 'supertest'
import { createApp } from '../../src/app'
import { AppDataSource } from '../../src/config/database'
import { Category } from '../../src/modules/categories/category.entity'
import { Transaction } from '../../src/modules/transactions/transaction.entity'
import { registerUser, useTestDatabase } from './helpers'

const app = createApp()

// Current UTC date, so trend/report windows (relative to "now") always include the seeded data.
const today = new Date().toISOString().slice(0, 10)
const [year, month] = today.split('-').map(Number)

type Actor = {
  name: string
  auth: { Authorization: string }
  categoryId: string
  transactionId: string
  title: string
  amount: number
}

async function createActor(name: string, amount: number): Promise<Actor> {
  const { token } = await registerUser(app, `User ${name}`)
  const auth = { Authorization: `Bearer ${token}` }

  const category = await request(app).post('/api/categories').set(auth)
    .send({ name: `Categoria ${name}`, type: 'expense' })
  expect(category.status).toBe(201)

  const title = `Despesa ${name}`
  const transaction = await request(app).post('/api/transactions').set(auth)
    .send({ title, amount, type: 'expense', date: today, categoryId: category.body.id })
  expect(transaction.status).toBe(201)

  return { name, auth, categoryId: category.body.id, transactionId: transaction.body.id, title, amount }
}

function transactions() {
  return AppDataSource.getRepository(Transaction)
}

describe('Isolamento entre usuarios', () => {
  useTestDatabase()

  const actors: Record<'A' | 'B', Actor> = {} as Record<'A' | 'B', Actor>

  beforeEach(async () => {
    actors.A = await createActor('A', 100)
    actors.B = await createActor('B', 7000)
  })

  describe.each([['A', 'B'], ['B', 'A']] as const)('%s acessando dados de %s', (me, other) => {
    const self = () => actors[me]
    const victim = () => actors[other]

    // 1
    it('lista apenas as proprias transacoes', async () => {
      const res = await request(app).get('/api/transactions').set(self().auth)

      expect(res.status).toBe(200)
      expect(res.body.data.map((t: Transaction) => t.id)).toEqual([self().transactionId])
    })

    // 2
    it('nao edita transacao de outro usuario', async () => {
      const res = await request(app).put(`/api/transactions/${victim().transactionId}`).set(self().auth)
        .send({ title: 'invadido' })

      expect(res.status).toBe(404)
      expect(await transactions().findOneByOrFail({ id: victim().transactionId }))
        .toMatchObject({ title: victim().title })
    })

    it('edita a propria transacao', async () => {
      const res = await request(app).put(`/api/transactions/${self().transactionId}`).set(self().auth)
        .send({ title: 'editada' })

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('editada')
    })

    // 3
    it('nao exclui transacao de outro usuario', async () => {
      const res = await request(app).delete(`/api/transactions/${victim().transactionId}`).set(self().auth)

      expect(res.status).toBe(404)
      expect(await transactions().existsBy({ id: victim().transactionId })).toBe(true)
    })

    // 4
    it('nao cria transacao usando categoria de outro usuario', async () => {
      const res = await request(app).post('/api/transactions').set(self().auth)
        .send({ title: 'x', amount: 1, type: 'expense', date: today, categoryId: victim().categoryId })

      expect(res.status).toBe(404)
      expect(await transactions().countBy({ categoryId: victim().categoryId })).toBe(1)
    })

    it('nao cria transacao recorrente usando categoria de outro usuario', async () => {
      const res = await request(app).post('/api/transactions').set(self().auth)
        .send({
          title: 'x', amount: 1, type: 'expense', date: '2026-01-10',
          categoryId: victim().categoryId, isRecurring: true, recurrenceEndDate: '2026-06-10',
        })

      expect(res.status).toBe(404)
      expect(await transactions().countBy({ categoryId: victim().categoryId })).toBe(1)
    })

    // 5
    it('nao move a propria transacao para categoria de outro usuario', async () => {
      const res = await request(app).put(`/api/transactions/${self().transactionId}`).set(self().auth)
        .send({ categoryId: victim().categoryId })

      expect(res.status).toBe(404)
      expect(await transactions().findOneByOrFail({ id: self().transactionId }))
        .toMatchObject({ categoryId: self().categoryId })
    })

    // 6
    it('filtro por categoria de outro usuario nao retorna dados', async () => {
      const res = await request(app).get(`/api/transactions?categoryId=${victim().categoryId}`).set(self().auth)

      expect(res.status).toBe(200)
      expect(res.body.total).toBe(0)
    })

    it('resumo, tendencia, relatorio e CSV contem apenas os proprios valores', async () => {
      const summary = await request(app).get(`/api/transactions/summary?month=${month}&year=${year}`).set(self().auth)
      expect(summary.body).toMatchObject({ income: 0, expense: self().amount })

      const trend = await request(app).get('/api/transactions/trend?months=1').set(self().auth)
      expect(trend.body).toEqual([expect.objectContaining({ month, year, expense: self().amount })])

      const report = await request(app).get('/api/reports/financial').set(self().auth)
      expect(report.body.totals).toMatchObject({ expense: self().amount, transactionCount: 1 })

      const csv = await request(app).get('/api/transactions/export').set(self().auth)
      expect(csv.text).toContain(self().title)
      expect(csv.text).not.toContain(victim().title)
    })

    // 7
    it('lista apenas as proprias categorias', async () => {
      const res = await request(app).get('/api/categories').set(self().auth)

      expect(res.body.map((c: Category) => c.id)).toEqual([self().categoryId])
    })

    // 8
    it('nao edita categoria de outro usuario', async () => {
      const res = await request(app).put(`/api/categories/${victim().categoryId}`).set(self().auth)
        .send({ name: 'invadida' })

      expect(res.status).toBe(404)
      expect(await AppDataSource.getRepository(Category).findOneByOrFail({ id: victim().categoryId }))
        .toMatchObject({ name: `Categoria ${victim().name}` })
    })

    it('nao exclui categoria de outro usuario nem desvincula as transacoes dele', async () => {
      const res = await request(app).delete(`/api/categories/${victim().categoryId}`).set(self().auth)

      expect(res.status).toBe(404)
      expect(await AppDataSource.getRepository(Category).existsBy({ id: victim().categoryId })).toBe(true)
      expect(await transactions().findOneByOrFail({ id: victim().transactionId }))
        .toMatchObject({ categoryId: victim().categoryId })
    })
  })

  describe('tipo da categoria', () => {
    it('rejeita categoria de receita em transacao de despesa', async () => {
      const income = await request(app).post('/api/categories').set(actors.A.auth)
        .send({ name: 'Salario', type: 'income' })

      const res = await request(app).post('/api/transactions').set(actors.A.auth)
        .send({ title: 'x', amount: 1, type: 'expense', date: today, categoryId: income.body.id })

      expect(res.status).toBe(400)
      expect(await transactions().countBy({ categoryId: income.body.id })).toBe(0)
    })

    it('rejeita mudar o tipo da transacao mantendo categoria incompativel', async () => {
      const res = await request(app).put(`/api/transactions/${actors.A.transactionId}`).set(actors.A.auth)
        .send({ type: 'income' })

      expect(res.status).toBe(400)
      expect(await transactions().findOneByOrFail({ id: actors.A.transactionId }))
        .toMatchObject({ type: 'expense' })
    })

    it('permite mudar o tipo junto com uma categoria compativel', async () => {
      const income = await request(app).post('/api/categories').set(actors.A.auth)
        .send({ name: 'Freelance', type: 'income' })

      const res = await request(app).put(`/api/transactions/${actors.A.transactionId}`).set(actors.A.auth)
        .send({ type: 'income', categoryId: income.body.id })

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ type: 'income', categoryId: income.body.id })
    })
  })
})
