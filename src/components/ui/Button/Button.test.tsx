import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  // ── Renderização básica ──
  it('renders children as button text', () => {
    render(<Button>Registrar</Button>)
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeInTheDocument()
  })

  it('renders as a native <button> element', () => {
    render(<Button>Registrar</Button>)
    expect(screen.getByRole('button').tagName).toBe('BUTTON')
  })

  // ── Variantes ──
  it.each([
    ['primary', 'bg-[var(--color-primary)]'],
    ['secondary', 'bg-[var(--color-success-soft)]'],
    ['ghost', 'bg-transparent'],
    ['pill', 'rounded-[var(--radius-pill)]'],
  ] as const)('applies the correct classes for the %s variant', (variant, expectedClass) => {
    render(<Button variant={variant}>Ação</Button>)
    expect(screen.getByRole('button').className).toContain(expectedClass)
  })

  it('defaults to the primary variant when none is specified', () => {
    render(<Button>Ação</Button>)
    expect(screen.getByRole('button').className).toContain('bg-[var(--color-primary)]')
  })

  // ── Eventos ──
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Registrar</Button>)

    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <Button onClick={handleClick} disabled>
        Registrar
      </Button>
    )

    await user.click(screen.getByRole('button'))

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('does not call onClick when loading', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <Button onClick={handleClick} loading>
        Registrar
      </Button>
    )

    await user.click(screen.getByRole('button'))

    expect(handleClick).not.toHaveBeenCalled()
  })

  // ── Estado disabled ──
  it('applies the native disabled attribute when disabled', () => {
    render(<Button disabled>Registrar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies the native disabled attribute when loading', () => {
    render(<Button loading>Registrar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is not disabled by default', () => {
    render(<Button>Registrar</Button>)
    expect(screen.getByRole('button')).toBeEnabled()
  })

  // ── Estado loading ──
  it('shows the loading label instead of children when loading', () => {
    render(<Button loading>Registrar</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Aguarde...')
    expect(screen.queryByText('Registrar')).not.toBeInTheDocument()
  })

  it('sets aria-busy to true when loading', () => {
    render(<Button loading>Registrar</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })

  it('sets aria-busy to false when not loading', () => {
    render(<Button>Registrar</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false')
  })

  // ── Acessibilidade: foco ──
  it('is focusable when enabled', () => {
    render(<Button>Registrar</Button>)
    const button = screen.getByRole('button')
    button.focus()
    expect(button).toHaveFocus()
  })

  it('is not focusable when disabled', () => {
    render(<Button disabled>Registrar</Button>)
    const button = screen.getByRole('button')
    button.focus()
    expect(button).not.toHaveFocus()
  })

  it('includes visible focus-ring classes for keyboard navigation', () => {
    render(<Button>Registrar</Button>)
    expect(screen.getByRole('button').className).toContain('focus-visible:ring-2')
  })

  // ── fullWidth ──
  it('is full width by default', () => {
    render(<Button>Registrar</Button>)
    expect(screen.getByRole('button').className).toContain('w-full')
  })

  it('is auto width when fullWidth is false', () => {
    render(<Button fullWidth={false}>Registrar</Button>)
    expect(screen.getByRole('button').className).toContain('w-auto')
  })

  // ── Customização ──
  it('applies customColor and customTextColor via inline style', () => {
    render(
      <Button customColor="#123456" customTextColor="#abcdef">
        Ação
      </Button>
    )
    const button = screen.getByRole('button')
    expect(button).toHaveStyle({ backgroundColor: '#123456', color: '#abcdef' })
  })

  it('uses the pill radius even with a custom color', () => {
    render(
      <Button variant="pill" customColor="#123456">
        + Foto
      </Button>
    )
    expect(screen.getByRole('button').className).toContain('rounded-[var(--radius-pill)]')
  })
})
