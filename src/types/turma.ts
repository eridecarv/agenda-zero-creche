/**
 * Tipos relacionados a turmas e suas classificações.
 */

export type Nivel =
  | 'bercario_1'
  | 'bercario_2'
  | 'maternal_1'
  | 'maternal_2'

export type Turno =
  | 'manha'
  | 'tarde'
  | 'integral'

export type TipoTurma =
  | 'regular'
  | 'extracurricular'

export type Turma = {
  id: string
  escola_id: string
  nome: string
  nivel: Nivel | null
  turno: Turno | null
  tipo: TipoTurma
  ano: number
  ativo: boolean
  criado_em: string
}

export type CriancaTurma = {
  id: string
  crianca_id: string
  turma_id: string
  data_inicio: string
  data_fim: string | null
}