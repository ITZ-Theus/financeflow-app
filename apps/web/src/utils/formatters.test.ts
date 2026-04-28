import { describe, expect, it } from 'vitest'
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatMonth,
} from './formatters'

describe('formatters', () => {
  it('formata valores monetarios em reais', () => {
    const value = formatCurrency(1234.56)

    expect(value).toContain('R$')
    expect(value).toContain('1.234,56')
  })

  it('formata valores compactos em reais', () => {
    const value = formatCompactCurrency(123456)

    expect(value).toContain('R$')
    expect(value).toMatch(/123,?5?\s?mil|123,?5?K/i)
  })

  it('formata datas YYYY-MM-DD sem deslocar por timezone', () => {
    expect(formatDate('2026-04-28')).toBe('28/04/2026')
  })

  it('formata mes e ano em portugues', () => {
    expect(formatMonth(4, 2026)).toBe('abril de 2026')
  })
})
