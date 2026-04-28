import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CategoryIcon } from './CategoryIcon'

describe('CategoryIcon', () => {
  it('renderiza um icone conhecido como svg', () => {
    const { container } = render(<CategoryIcon icon="wallet" />)

    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renderiza fallback textual para icones legados desconhecidos', () => {
    render(<CategoryIcon icon="custom-icon" />)

    expect(screen.getByText('custom-icon')).toBeInTheDocument()
  })
})
