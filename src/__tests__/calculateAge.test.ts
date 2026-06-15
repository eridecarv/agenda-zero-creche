import { calculateAge } from '@/lib/calculateAge'

describe('calculateAge', () => {
  it('retorna vazio quando a data é nula', () => {
    expect(calculateAge(null)).toBe('')
  })

  it('retorna meses quando menor de 1 ano', () => {
    const hoje = new Date()
    const nascimento = new Date(hoje)
    nascimento.setMonth(hoje.getMonth() - 8)
    expect(calculateAge(nascimento.toISOString())).toBe('8m')
  })

  it('retorna anos e meses corretamente', () => {
    const hoje = new Date()
    const nascimento = new Date(hoje)
    nascimento.setFullYear(hoje.getFullYear() - 1)
    nascimento.setMonth(hoje.getMonth() - 3)
    expect(calculateAge(nascimento.toISOString())).toBe('1a 3m')
  })

  it('retorna só anos quando meses restantes são zero', () => {
    const hoje = new Date()
    const nascimento = new Date(hoje)
    nascimento.setFullYear(hoje.getFullYear() - 2)
    expect(calculateAge(nascimento.toISOString())).toBe('2a')
  })
})