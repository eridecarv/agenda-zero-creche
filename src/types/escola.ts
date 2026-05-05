/**
 * Tipos relacionados à entidade Escola e perfis de usuário.
 */

export type Role =
  | 'adm'
  | 'coordenador'
  | 'professor'
  | 'auxiliar'
  | 'responsavel'

export type Escola = {
  id: string
  nome: string
  criado_em: string
}

export type Usuario = {
  id: string
  escola_id: string
  nome: string
  apelido: string | null
  telefone: string | null
  cpf_hash: string | null
  senha_hash: string | null
  role: Role
  ativo: boolean
  criado_em: string
  desativado_em: string | null
}