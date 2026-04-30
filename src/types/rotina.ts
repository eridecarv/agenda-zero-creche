/**
 * Tipos relacionados aos registros diários de rotina da criança.
 * Inclui presença, alimentação, higiene e resumo narrativo.
 */

export type Humor =
  | 'contente'
  | 'tranquilo'
  | 'agitado'
  | 'choroso'

export type Sono =
  | 'bom'
  | 'regular'
  | 'ruim'
  | 'nao_dormiu'

export type Refeicao =
  | 'cafe'
  | 'lanche_manha'
  | 'almoco'
  | 'lanche_tarde'
  | 'jantar'

export type Aceitacao =
  | 'boa'
  | 'regular'
  | 'recusou'

export type RegistroDiario = {
  id: string
  escola_id: string
  crianca_id: string
  data: string
  humor: Humor | null
  sono: Sono | null
  observacao: string | null
  registrado_por: string | null
  atualizado_em: string
  criado_em: string
}

export type RegistroPresenca = {
  id: string
  registro_diario_id: string
  presente: boolean
  entrada: string | null
  saida: string | null
  buscou_id: string | null
  criado_em: string
}

export type RegistroAlimentacao = {
  id: string
  registro_diario_id: string
  refeicao: Refeicao
  aceitacao: Aceitacao
  criado_em: string
}

export type RegistroHigiene = {
  id: string
  registro_diario_id: string
  banho: boolean
  escovacao: boolean
  evacuacao: boolean
  observacao: string | null
  criado_em: string
}

export type ResumoDiario = {
  id: string
  registro_diario_id: string
  texto_gerado: string
  gerado_em: string
  criado_em: string
}