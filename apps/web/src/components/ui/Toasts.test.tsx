import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toasts } from './Toasts'
import { toast, useToastStore } from '../../store/toastStore'

describe('Toasts', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToastStore.setState({ toasts: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('exibe notificacao criada pelo store', () => {
    render(<Toasts />)

    act(() => {
      toast.success('Categoria criada', 'Sua categoria foi salva.')
    })

    expect(screen.getByText('Categoria criada')).toBeInTheDocument()
    expect(screen.getByText('Sua categoria foi salva.')).toBeInTheDocument()
  })

  it('remove notificacao ao clicar no botao de fechar', () => {
    render(<Toasts />)

    act(() => {
      toast.error('Erro ao salvar')
    })
    fireEvent.click(screen.getByLabelText('Fechar notificacao'))

    expect(screen.queryByText('Erro ao salvar')).not.toBeInTheDocument()
  })
})
