import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Chip } from './Chip'

describe('Chip', () => {
  it('renders the label', () => {
    render(<Chip label="Alimentação" />)
    expect(screen.getByText('Alimentação')).toBeInTheDocument()
  })

  it('applies variant classes when active is not set', () => {
    render(<Chip label="Completo" variant="success" />)
    expect(screen.getByText('Completo')).toHaveClass('bg-success-soft', 'text-success-strong')
  })

  it('defaults to the primary variant when none is passed', () => {
    render(<Chip label="Test" />)
    expect(screen.getByText('Test')).toHaveClass('bg-primary-soft')
  })

  it('applies active filter classes when active is true', () => {
    render(<Chip label="Hoje" active />)
    expect(screen.getByText('Hoje')).toHaveClass('bg-primary', 'text-white')
  })

  it('applies inactive filter classes when active is false', () => {
    render(<Chip label="Esta semana" active={false} />)
    expect(screen.getByText('Esta semana')).toHaveClass('bg-inactive', 'text-fg2')
  })

  it('ignores variant when active is defined', () => {
    render(<Chip label="Hoje" active variant="danger" />)
    expect(screen.getByText('Hoje')).not.toHaveClass('bg-danger-soft')
  })

  it('calls onClick when clicked, if provided', () => {
    const handleClick = vi.fn()
    render(<Chip label="Hoje" active onClick={handleClick} />)
    fireEvent.click(screen.getByText('Hoje'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when onClick is not provided', () => {
    render(<Chip label="Alimentação" />)
    expect(screen.getByText('Alimentação').closest('button')).toBeDisabled()
  })

  it('renders a dot when dot is true', () => {
    const { container } = render(<Chip label="Alimentação" dot />)
    expect(container.querySelector('.rounded-full.bg-current')).toBeInTheDocument()
  })
})
