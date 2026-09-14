import { guardianDisplayName } from '@/lib/guardianDisplayName'

describe('guardianDisplayName', () => {
  it('retorna o apelido quando existe', () => {
    const guardian = {
      user_id: '123',
      name: 'Leonidas Silva',
      nickname: 'Vô Léo',
      relation: 'avo',
    }
    expect(guardianDisplayName(guardian)).toBe('Vô Léo')
  })

  it('retorna grau e primeiro nome quando não tem apelido', () => {
    const guardian = {
      user_id: '123',
      name: 'Leonidas Silva',
      nickname: null,
      relation: 'avo',
    }
    expect(guardianDisplayName(guardian)).toBe('Avô — Leonidas')
  })

  it('retorna Responsável quando a relação não é reconhecida', () => {
    const guardian = {
      user_id: '123',
      name: 'Carlos Souza',
      nickname: null,
      relation: 'padrinho',
    }
    expect(guardianDisplayName(guardian)).toBe('Responsável — Carlos')
  })
})
