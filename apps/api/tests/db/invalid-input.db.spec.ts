import request from 'supertest'
import { createApp } from '../../src/app'
import { AppDataSource } from '../../src/config/database'
import { registerUser, useTestDatabase } from './helpers'

const app = createApp()

const VALID_UUID = '00000000-0000-4000-8000-000000000000'
const TOO_LARGE = 100_000_000

type Case = [label: string, status: number, method: 'get' | 'post' | 'put' | 'delete', path: string, body?: object | string]

const cases: Case[] = [
  ['PUT transacao com id invalido', 422, 'put', '/api/transactions/not-a-uuid', { title: 'x' }],
  ['DELETE transacao com id invalido', 422, 'delete', '/api/transactions/not-a-uuid'],
  ['PUT categoria com id invalido', 422, 'put', '/api/categories/not-a-uuid', { name: 'x' }],
  ['DELETE categoria com id invalido', 422, 'delete', '/api/categories/not-a-uuid'],
  ['PUT meta com id invalido', 422, 'put', '/api/goals/not-a-uuid', { title: 'x' }],
  ['DELETE meta com id invalido', 422, 'delete', '/api/goals/not-a-uuid'],
  ['PUT orcamento com id invalido', 422, 'put', '/api/budgets/not-a-uuid', { amount: 1 }],
  ['DELETE orcamento com id invalido', 422, 'delete', '/api/budgets/not-a-uuid'],
  ['transacao com data invalida', 422, 'post', '/api/transactions', { title: 'x', amount: 10, type: 'expense', date: 'abc' }],
  ['transacao acima de numeric(10,2)', 422, 'post', '/api/transactions', { title: 'x', amount: TOO_LARGE, type: 'expense', date: '2026-01-01' }],
  ['recorrencia com data final invalida', 422, 'post', '/api/transactions', { title: 'x', amount: 10, type: 'expense', date: '2026-01-01', isRecurring: true, recurrenceEndDate: 'abc' }],
  ['meta com prazo invalido', 422, 'post', '/api/goals', { title: 'x', targetAmount: 10, deadline: 'abc' }],
  ['meta com alvo acima de numeric(10,2)', 422, 'post', '/api/goals', { title: 'x', targetAmount: TOO_LARGE, deadline: '2027-01-01' }],
  ['meta com valor atual acima de numeric(10,2)', 422, 'put', `/api/goals/${VALID_UUID}`, { currentAmount: TOO_LARGE }],
  ['orcamento acima de numeric(10,2)', 422, 'post', '/api/budgets', { amount: TOO_LARGE, month: 1, year: 2026, categoryId: VALID_UUID }],
  ['JSON malformado', 400, 'post', '/api/transactions', '{"title":'],
  ['listagem com categoryId invalido', 422, 'get', '/api/transactions?categoryId=not-a-uuid'],
  ['listagem com tipo invalido', 422, 'get', '/api/transactions?type=banana'],
  ['listagem com limit negativo', 422, 'get', '/api/transactions?limit=-5'],
  ['listagem com mes invalido', 422, 'get', '/api/transactions?month=13&year=2026'],
  ['resumo com categoryId invalido', 422, 'get', '/api/transactions/summary?categoryId=abc'],
  ['exportacao com tipo invalido', 422, 'get', '/api/transactions/export?type=banana'],
  ['tendencia com meses invalidos', 422, 'get', '/api/transactions/trend?months=abc'],
  ['relatorio com data inexistente', 422, 'get', '/api/reports/financial?startDate=2026-02-30'],
]

describe('Entrada invalida retorna 4xx, nunca 500', () => {
  useTestDatabase()

  let auth: { Authorization: string }

  beforeEach(async () => {
    const { token } = await registerUser(app)
    auth = { Authorization: `Bearer ${token}` }
  })

  // Rest parameter on purpose: rows without a body have fewer values than names, and a
  // fixed 5-parameter callback would make Jest pass `done` as `body` and wait for it.
  it.each(cases)('%s -> %i', async (...[, status, method, path, body]: Case) => {
    let req = request(app)[method](path).set(auth)
    if (typeof body === 'string') req = req.set('Content-Type', 'application/json').send(body)
    else if (body) req = req.send(body)

    const res = await req

    expect(res.status).toBe(status)
    expect(res.body.requestId).toEqual(expect.any(String))

    const [{ count }] = await AppDataSource.query(
      'SELECT (SELECT count(*) FROM transactions) + (SELECT count(*) FROM goals) + (SELECT count(*) FROM budgets) + (SELECT count(*) FROM categories) AS count'
    )
    expect(Number(count)).toBe(0)
  })

  it('corpo acima do limite -> 413', async () => {
    const res = await request(app).post('/api/transactions').set(auth)
      .send({ title: 'x'.repeat(1_100_000), amount: 10, type: 'expense', date: '2026-01-01' })

    expect(res.status).toBe(413)
    expect(res.body.requestId).toEqual(expect.any(String))
  })

  it('id valido de recurso inexistente continua 404', async () => {
    const res = await request(app).delete(`/api/transactions/${VALID_UUID}`).set(auth)

    expect(res.status).toBe(404)
  })

  it('consultas validas continuam funcionando', async () => {
    const list = await request(app).get('/api/transactions?page=1&limit=20&month=5&year=2026&type=expense').set(auth)
    const trend = await request(app).get('/api/transactions/trend?months=6').set(auth)
    const report = await request(app).get('/api/reports/financial?startDate=2026-01-01&endDate=2026-03-31').set(auth)

    expect([list.status, trend.status, report.status]).toEqual([200, 200, 200])
    expect(list.body).toMatchObject({ page: 1, total: 0 })
  })
})
