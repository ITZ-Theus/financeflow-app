import { describe, expect, it } from 'vitest'
import { resolveApiBaseUrl } from './api'

describe('resolveApiBaseUrl', () => {
  it('mantem a URL configurada quando ela e publica', () => {
    expect(resolveApiBaseUrl('https://api.example.com/api', 'financeflow.app')).toBe('https://api.example.com/api')
  })

  it('troca host.docker.internal por localhost no browser local', () => {
    expect(resolveApiBaseUrl('http://host.docker.internal:3333/api', 'localhost')).toBe('http://localhost:3333/api')
  })

  it('mantem host.docker.internal quando o browser tambem roda no container', () => {
    expect(resolveApiBaseUrl('http://host.docker.internal:3333/api', 'host.docker.internal')).toBe(
      'http://host.docker.internal:3333/api'
    )
  })

  it('troca host.docker.internal pela API de producao fora do ambiente local', () => {
    expect(resolveApiBaseUrl('http://host.docker.internal:3333/api', 'financeflow-app-eight.vercel.app')).toBe('https://financeflow-api-q5ax.onrender.com/api')
  })
})
