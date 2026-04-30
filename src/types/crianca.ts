/**
 * Tipos relacionados a crianças e seus vínculos com responsáveis.
 */

export type Crianca = {
  id: string
  escola_id: string
  nome: string
  data_nascimento: string | null
  observacoes: string | null
  ativo: boolean
  criado_em: string
}

export type TipoVinculo = 'principal' | 'secundario'

export type RelacaoVinculo =
  | 'mae'
  | 'pai'
  | 'avo'
  | 'ava'
  | 'tio'
  | 'tia'
  | 'outro'

export type Vinculo = {
  id: string
  escola_id: string
  crianca_id: string
  usuario_id: string
  tipo: TipoVinculo
  relacao: RelacaoVinculo | null
  apelido: string | null
  ativo: boolean
  data_inicio: string
  data_fim: string | null
  adicionado_por: string | null
  criado_em: string
}