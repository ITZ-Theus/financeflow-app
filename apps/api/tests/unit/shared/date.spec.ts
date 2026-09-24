import { isIsoDate, isoDateSchema } from '../../../src/shared/validation/date'

describe('isIsoDate', () => {
  it.each([
    'abc',
    '',
    '2026',
    '2026-1-1',
    '2026-01-1',
    '2026-02-30',
    '2025-02-29',
    '2026-13-01',
    '2026-00-10',
    '2026-01-00',
    '2026-01-32',
    '2026-01-01T00:00:00Z',
    ' 2026-01-01',
  ])('rejeita %p', (value) => {
    expect(isIsoDate(value)).toBe(false)
  })

  it.each([
    '2026-01-01',
    '2026-01-31',
    '2026-12-31',
    '2028-02-29',
    '2026-02-28',
  ])('aceita %p', (value) => {
    expect(isIsoDate(value)).toBe(true)
  })
})

describe('isoDateSchema', () => {
  it('aceita data valida', () => {
    expect(isoDateSchema.parse('2026-01-01')).toBe('2026-01-01')
  })

  it.each(['abc', '2026-02-30', '2026-13-01'])('rejeita %p com mensagem de validacao', (value) => {
    const result = isoDateSchema.safeParse(value)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Use uma data valida no formato YYYY-MM-DD')
    }
  })
})
