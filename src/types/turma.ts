/**
 * Tipos relacionados a turmas e suas classificações.
 */

export type Turno =
  | 'manha'
  | 'tarde'
  | 'integral'
  | 'noite'

export type TipoTurma =
  | 'regular'
  | 'extracurricular'

export type Turma = {
  id: string
  escola_id: string
  nome: string
  nivel: string | null
  turno: Turno | null
  tipo: TipoTurma
  ano: number
  ativo: boolean
  criado_em: string
  desativado_em: string | null
}

export type CriancaTurma = {
  id: string
  crianca_id: string
  turma_id: string
  data_inicio: string
  data_fim: string | null
}