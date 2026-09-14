import { render, screen } from '@testing-library/react'
import { BottomNav } from '@/components/ui/BottomNav'

const items = [
  { label: 'Início', icon: '🏠', href: '/home', active: true },
  { label: 'Diário', icon: '📖', href: '/diary' },
  { label: 'Fotos', icon: '📸', href: '/photos' },
]

describe('BottomNav', () => {
  it('renderiza todos os itens', () => {
    render(<BottomNav items={items} />)
    expect(screen.getByText('Início')).toBeInTheDocument()
    expect(screen.getByText('Diário')).toBeInTheDocument()
    expect(screen.getByText('Fotos')).toBeInTheDocument()
  })

  it('renderiza o ponto laranja só no item ativo', () => {
    render(<BottomNav items={items} />)
    const pontos = document.querySelectorAll('span[style*="border-radius: 50%"]')
    expect(pontos).toHaveLength(1)
  })

  it('os links apontam para os hrefs corretos', () => {
    render(<BottomNav items={items} />)
    expect(screen.getByRole('link', { name: /início/i })).toHaveAttribute('href', '/home')
    expect(screen.getByRole('link', { name: /diário/i })).toHaveAttribute('href', '/diary')
  })
})
