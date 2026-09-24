import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../helpers/app'

jest.mock('../../src/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}))

import { AppDataSource } from '../../src/config/database'

const app = createApp()

function makeToken(userId = 'user-uuid-1') {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui', { expiresIn: '1h' })
}

describe('Goal Routes - /api/goals', () => {
  let repo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock; findOneBy: jest.Mock }

  beforeEach(() => {
    repo = {
      findOne: jest.fn().mockResolvedValue({ id: 'user-uuid-1' }),
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
    }
    ;(AppDataSource.getRepository as jest.Mock).mockReturnValue(repo)
  })

  it.each(['abc', '2026-02-30'])('POST deve retornar 422 para deadline %p sem gravar', async (deadline) => {
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: 'Viagem', targetAmount: 1000, deadline })

    expect(res.status).toBe(422)
    expect(res.body.errors[0].field).toBe('deadline')
    expect(repo.save).not.toHaveBeenCalled()
  })

  it('PUT deve retornar 422 para deadline invalido sem consultar a meta', async () => {
    const res = await request(app)
      .put('/api/goals/goal-uuid-1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ deadline: 'abc' })

    expect(res.status).toBe(422)
    expect(repo.findOneBy).not.toHaveBeenCalled()
  })
})
