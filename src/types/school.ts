/**
 * Tipos relacionados à entidade Escola e perfis de usuário.
 */

export type Role =
  | 'adm'
  | 'coordenador'
  | 'professor'
  | 'auxiliar'
  | 'responsavel'

export type School = {
  id: string
  name: string
  created_at: string
}

export type User = {
  id: string
  school_id: string
  name: string
  nickname: string | null
  phone: string | null
  cpf_hash: string | null
  password_hash: string | null
  role: Role
  active: boolean
  created_at: string
  deactivated_at: string | null
}