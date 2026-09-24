import request from 'supertest'
import { createApp } from '../../src/app'
import { AppDataSource } from '../../src/config/database'
import { Budget } from '../../src/modules/budgets/budget.entity'
import { Goal } from '../../src/modules/goals/goal.entity'
import { Transaction } from '../../src/modules/transactions/transaction.entity'
import { registerUser, useTestDatabase } from './helpers'

const app = createApp()

describe('Valores monetarios (numeric) vindos do PostgreSQL', () => {
  useTestDatabase()

  let auth: { Authorization: string }

  beforeEach(async () => {
    const { token } = await registerUser(app)
    auth = { Authorization: `Bearer ${token}` }
  })

  it.each([123.45, 0.01, 99_999_999.99])('transacao de %p volta como number exato', async (amount) => {
    const created = await request(app).post('/api/transactions').set(auth)
      .send({ title: 'x', amount, type: 'income', date: '2026-05-10' })
    expect(created.status).toBe(201)

    const list = await request(app).get('/api/transactions').set(auth)
    expect(list.body.data[0].amount).toBe(amount)

    const stored = await AppDataSource.getRepository(Transaction).findOneByOrFail({ id: created.body.id })
    expect(stored.amount).toBe(amount)
  })

  it('meta e orcamento voltam com valores number, inclusive o default de currentAmount', async () => {
    const goal = await request(app).post('/api/goals').set(auth)
      .send({ title: 'Reserva', targetAmount: 25000, deadline: '2027-12-31' })
    expect(goal.status).toBe(201)

    const goals = await request(app).get('/api/goals').set(auth)
    expect(goals.body[0]).toMatchObject({ targetAmount: 25000, currentAmount: 0 })

    const stored = await AppDataSource.getRepository(Goal).findOneByOrFail({ id: goal.body.id })
    expect(stored).toMatchObject({ targetAmount: 25000, currentAmount: 0 })

    const category = await request(app).post('/api/categories').set(auth).send({ name: 'Mercado', type: 'expense' })
    await request(app).post('/api/budgets').set(auth)
      .send({ amount: 1400.5, month: 5, year: 2026, categoryId: category.body.id })

    const budget = await AppDataSource.getRepository(Budget).findOneByOrFail({ categoryId: category.body.id })
    expect(budget.amount).toBe(1400.5)
  })

  // Regression: "3850.00" >= "12000.00" is true as text, so a title-only edit completed the goal.
  it('editar apenas o titulo nao conclui uma meta abaixo do alvo', async () => {
    const goal = await request(app).post('/api/goals').set(auth)
      .send({ title: 'Viagem internacional', targetAmount: 12000, deadline: '2027-06-30' })
    await request(app).put(`/api/goals/${goal.body.id}`).set(auth).send({ currentAmount: 3850 })

    const res = await request(app).put(`/api/goals/${goal.body.id}`).set(auth).send({ title: 'Viagem para o Japao' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('active')
    expect(await AppDataSource.getRepository(Goal).findOneByOrFail({ id: goal.body.id }))
      .toMatchObject({ status: 'active', currentAmount: 3850 })
  })

  it('meta e concluida quando o valor atual atinge o alvo', async () => {
    const goal = await request(app).post('/api/goals').set(auth)
      .send({ title: 'Notebook', targetAmount: 900, deadline: '2027-06-30' })

    const res = await request(app).put(`/api/goals/${goal.body.id}`).set(auth).send({ currentAmount: 900 })

    expect(res.body.status).toBe('completed')
  })
})
