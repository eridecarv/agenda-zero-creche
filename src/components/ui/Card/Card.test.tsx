import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Conteúdo de teste</Card>)
    expect(screen.getByText('Conteúdo de teste')).toBeInTheDocument()
  })

  it('applies the default padding (md)', () => {
    const { container } = render(<Card>Conteúdo</Card>)
    expect(container.firstChild).toHaveClass('p-4')
  })

  it('applies padding sm and lg when specified', () => {
    const { container: sm } = render(<Card padding="sm">Conteúdo</Card>)
    expect(sm.firstChild).toHaveClass('p-3')

    const { container: lg } = render(<Card padding="lg">Conteúdo</Card>)
    expect(lg.firstChild).toHaveClass('p-5')
  })

  it('calls onClick when clicked, if provided', () => {
    const handleClick = vi.fn()
    render(<Card onClick={handleClick}>Conteúdo</Card>)
    fireEvent.click(screen.getByText('Conteúdo'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not add interactive classes when onClick is not provided', () => {
    const { container } = render(<Card>Conteúdo</Card>)
    expect(container.firstChild).not.toHaveClass('cursor-pointer')
  })

  it('merges custom className with the base classes', () => {
    const { container } = render(<Card className="custom-class">Conteúdo</Card>)
    expect(container.firstChild).toHaveClass('custom-class')
    expect(container.firstChild).toHaveClass('rounded-lg')
  })
})
