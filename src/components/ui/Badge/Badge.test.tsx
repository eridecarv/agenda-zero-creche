import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders the label', () => {
    render(<Badge label="Maternal I" />)
    expect(screen.getByText('Maternal I')).toBeInTheDocument()
  })

  it('defaults to the primary variant', () => {
    render(<Badge label="Maternal I" />)
    expect(screen.getByText('Maternal I')).toHaveClass('bg-primary-soft')
  })

  it('applies the correct classes for each variant', () => {
    const { rerender } = render(<Badge label="Test" variant="success" />)
    expect(screen.getByText('Test')).toHaveClass('bg-success-soft', 'text-success-strong')

    rerender(<Badge label="Test" variant="warning" />)
    expect(screen.getByText('Test')).toHaveClass('bg-warning-soft', 'text-warning-strong')

    rerender(<Badge label="Test" variant="danger" />)
    expect(screen.getByText('Test')).toHaveClass('bg-danger-soft', 'text-danger-strong')
  })

  it('does not render a dot by default', () => {
    const { container } = render(<Badge label="Test" />)
    expect(container.querySelector('.rounded-full')).not.toBeInTheDocument()
  })

  it('renders a dot when dot is true', () => {
    const { container } = render(<Badge label="Test" dot />)
    expect(container.querySelector('.rounded-full')).toBeInTheDocument()
  })
})
