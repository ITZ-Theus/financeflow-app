import { moneyTransformer } from '../../../src/shared/database/moneyTransformer'

describe('moneyTransformer', () => {
  it.each([
    ['3850.00', 3850],
    ['0.01', 0.01],
    ['123.45', 123.45],
    ['99999999.99', 99_999_999.99],
  ])('converte numeric %p do banco em number %p', (raw, expected) => {
    expect(moneyTransformer.from(raw)).toBe(expected)
  })

  it('preserva null de colunas vazias', () => {
    expect(moneyTransformer.from(null)).toBeNull()
  })

  it('compara valores numericamente depois da conversao', () => {
    // As strings, "3850.00" >= "12000.00" is true; this was the goal completion bug.
    expect(moneyTransformer.from('3850.00') >= moneyTransformer.from('12000.00')).toBe(false)
  })

  it('envia o valor ao banco sem alteracao', () => {
    expect(moneyTransformer.to(123.45)).toBe(123.45)
  })
})
