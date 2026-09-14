import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('renders with an accessible label from name', () => {
    render(<Avatar name="Lara Mendes" />)
    expect(screen.getByLabelText('Lara Mendes')).toBeInTheDocument()
  })

  it('renders the default emoji when none is provided', () => {
    render(<Avatar name="Lara Mendes" />)
    expect(screen.getByText('👶')).toBeInTheDocument()
  })

  it('renders a custom emoji when provided', () => {
    render(<Avatar name="Lara Mendes" emoji="🧒" />)
    expect(screen.getByText('🧒')).toBeInTheDocument()
  })

  it('renders an image instead of an emoji when photo is provided', () => {
    render(<Avatar name="Lara Mendes" photo="https://example.com/photo.jpg" />)
    const img = screen.getByRole('img', { name: 'Lara Mendes' })
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    expect(screen.queryByText('👶')).not.toBeInTheDocument()
  })

  it('applies the default size (md)', () => {
    const { container } = render(<Avatar name="Lara Mendes" />)
    expect(container.firstChild).toHaveClass('w-12', 'h-12')
  })

  it('applies sm and lg sizes when specified', () => {
    const { container: sm } = render(<Avatar name="Lara Mendes" size="sm" />)
    expect(sm.firstChild).toHaveClass('w-8', 'h-8')

    const { container: lg } = render(<Avatar name="Lara Mendes" size="lg" />)
    expect(lg.firstChild).toHaveClass('w-16', 'h-16')
  })

  it('applies the gradient background when there is no photo', () => {
    const { container } = render(<Avatar name="Lara Mendes" />)
    expect(container.firstChild).toHaveClass('bg-linear-to-br')
  })

  it('does not apply the gradient background when a photo is provided', () => {
    const { container } = render(
      <Avatar name="Lara Mendes" photo="https://example.com/photo.jpg" />
    )
    expect(container.firstChild).not.toHaveClass('bg-linear-to-br')
  })
})
