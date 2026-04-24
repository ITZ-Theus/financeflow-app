import { AppError } from '../../src/shared/errors/AppError'
import { getPaginationParams } from '../../src/shared/utils/pagination'

describe('AppError', () => {
  it('deve criar erro com mensagem e statusCode padrão 400', () => {
    const err = new AppError('Algo deu errado')
    expect(err.message).toBe('Algo deu errado')
    expect(err.statusCode).toBe(400)
  })

  it('deve criar erro com statusCode customizado', () => {
    const err = new AppError('Não autorizado', 401)
    expect(err.statusCode).toBe(401)
  })

  it('deve criar erro 404', () => {
    const err = new AppError('Não encontrado', 404)
    expect(err.statusCode).toBe(404)
  })

  it('deve criar erro 500', () => {
    const err = new AppError('Erro interno', 500)
    expect(err.statusCode).toBe(500)
  })
})

describe('getPaginationParams', () => {
  it('deve retornar page=1 e limit=10 como padrão', () => {
    const result = getPaginationParams({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
  })

  it('deve retornar os valores fornecidos', () => {
    const result = getPaginationParams({ page: '3', limit: '20' })
    expect(result.page).toBe(3)
    expect(result.limit).toBe(20)
  })

  it('deve limitar o máximo de itens a 100', () => {
    const result = getPaginationParams({ limit: '999' })
    expect(result.limit).toBe(100)
  })

  it('deve garantir page mínima de 1 para valores inválidos', () => {
    const result = getPaginationParams({ page: '-5' })
    expect(result.page).toBe(1)
  })

  it('deve ignorar valores não numéricos e usar padrão', () => {
    const result = getPaginationParams({ page: 'abc', limit: 'xyz' })
    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
  })
})
