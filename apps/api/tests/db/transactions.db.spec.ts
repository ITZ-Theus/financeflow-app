import request from 'supertest'
import { createApp } from '../../src/app'
import { AppDataSource } from '../../src/config/database'
import { Transaction } from '../../src/modules/transactions/transaction.entity'
import { registerUser, useTestDatabase } from './helpers'

const app = createApp()

describe('Transactions against PostgreSQL', () => {
  useTestDatabase()

  it('aplica todas as migrations em um banco vazio', async () => {
    const executed: Array<{ name: string }> = await AppDataSource.query('SELECT name FROM migrations ORDER BY id')

    expect(executed.map((migration) => migration.name).sort())
      .toEqual(AppDataSource.migrations.map((migration) => migration.name).sort())
  })

  it('persiste uma transacao com categoria e devolve na listagem do usuario', async () => {
    const { token, user } = await registerUser(app)
    const auth = { Authorization: `Bearer ${token}` }

    const category = await request(app)
      .post('/api/categories')
      .set(auth)
      .send({ name: 'Mercado', type: 'expense' })
    expect(category.status).toBe(201)

    const created = await request(app)
      .post('/api/transactions')
      .set(auth)
      .send({ title: 'Compra do mes', amount: 123.45, type: 'expense', date: '2026-05-10', categoryId: category.body.id })
    expect(created.status).toBe(201)

    const list = await request(app)
      .get('/api/transactions?month=5&year=2026')
      .set(auth)

    expect(list.status).toBe(200)
    expect(list.body.total).toBe(1)
    expect(list.body.data[0]).toMatchObject({
      id: created.body.id,
      title: 'Compra do mes',
      category: { id: category.body.id, name: 'Mercado' },
    })

    const stored = await AppDataSource.getRepository(Transaction).findOneByOrFail({ id: created.body.id })
    expect(stored.userId).toBe(user.id)
    expect(Number(stored.amount)).toBe(123.45)
  })

  it('comeca cada teste com as tabelas vazias', async () => {
    expect(await AppDataSource.getRepository(Transaction).count()).toBe(0)
  })
})
