import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  // ── Renderização básica ──
  it('renders with the given label', () => {
    render(<Input label="Nome da criança" />)
    expect(screen.getByLabelText('Nome da criança')).toBeInTheDocument()
  })

  it('renders as a native <input> element', () => {
    render(<Input label="Nome da criança" />)
    expect(screen.getByLabelText('Nome da criança').tagName).toBe('INPUT')
  })

  // ── Associação label/input ──
  it('associates the label to the input via matching id/htmlFor', () => {
    render(<Input label="Nome da criança" id="child-name" />)
    const input = screen.getByLabelText('Nome da criança')
    expect(input).toHaveAttribute('id', 'child-name')
  })

  it('generates an id automatically when none is passed', () => {
    render(<Input label="Nome da criança" />)
    const input = screen.getByLabelText('Nome da criança')
    expect(input.id).toBeTruthy()
  })

  // ── Estado de erro ──
  it('sets aria-invalid to true when error is present', () => {
    render(<Input label="Email" error="Email inválido." />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('sets aria-invalid to false when error is absent', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'false')
  })

  it('renders the error message when error is present', () => {
    render(<Input label="Email" error="Email inválido." />)
    expect(screen.getByText('Email inválido.')).toBeInTheDocument()
  })

  it('does not render an error message when error is absent', () => {
    render(<Input label="Email" />)
    expect(screen.queryByText(/inválido/)).not.toBeInTheDocument()
  })

  it('links the error message via aria-describedby when error is present', () => {
    render(<Input label="Email" error="Email inválido." />)
    const input = screen.getByLabelText('Email')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(screen.getByText('Email inválido.')).toHaveAttribute('id', describedBy!)
  })

  it('does not set aria-describedby when error is absent', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-describedby')
  })

  // ── Variações visuais de estado (default, foco, erro) ──
  it('applies the default state classes when there is no error', () => {
    render(<Input label="Nome da criança" />)
    const className = screen.getByLabelText('Nome da criança').className
    expect(className).toContain('bg-[var(--color-bg)]')
    expect(className).toContain('border-[var(--color-border-default)]')
  })

  it('applies the focus state classes when there is no error', () => {
    render(<Input label="Nome da criança" />)
    const className = screen.getByLabelText('Nome da criança').className
    expect(className).toContain('focus:border-[var(--color-primary-focus-border)]')
    expect(className).toContain('focus:ring-[var(--color-primary-focus-shadow)]')
  })

  it('applies the error state classes when error is present', () => {
    render(<Input label="Email" error="Email inválido." />)
    const className = screen.getByLabelText('Email').className
    expect(className).toContain('bg-[var(--color-danger-soft)]')
    expect(className).toContain('border-[var(--color-danger)]')
  })
})
