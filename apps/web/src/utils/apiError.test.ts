import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from './apiError'

describe('getApiErrorMessage', () => {
  it('retorna a mensagem enviada pela API em erros Axios', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: { message: 'Categoria em uso' },
      },
    }

    expect(getApiErrorMessage(error)).toBe('Categoria em uso')
  })

  it('retorna a mensagem de Error quando nao ha resposta da API', () => {
    expect(getApiErrorMessage(new Error('Falha de rede'))).toBe('Falha de rede')
  })

  it('retorna fallback para erros desconhecidos', () => {
    expect(getApiErrorMessage(null, 'Erro padrao')).toBe('Erro padrao')
  })
})
