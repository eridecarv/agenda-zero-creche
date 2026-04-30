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
  telefone: string | null
  senha_hash: string | null
  role: Role
  ativo: boolean
  criado_em: string
}