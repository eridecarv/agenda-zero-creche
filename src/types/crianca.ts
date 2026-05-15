/**
 * Tipos relacionados a crianças e seus vínculos com responsáveis.
 */

export type Child = {
  id: string
  school_id: string
  name: string
  birth_date: string | null
  notes: string | null
  active: boolean
  created_at: string
  deactivated_at: string | null
}

export type GuardianshipType = 'principal' | 'secundario'

export type GuardianRelation =
  | 'mae'
  | 'pai'
  | 'avo'
  | 'ava'
  | 'tio'
  | 'tia'
  | 'outro'

export type Guardianship = {
  id: string
  school_id: string
  child_id: string
  user_id: string
  type: GuardianshipType
  relation: GuardianRelation | null
  nickname: string | null
  active: boolean
  start_date: string
  end_date: string | null
  added_by: string | null
  created_at: string
}

export type ChildClass = {
  id: string
  school_id: string
  child_id: string
  class_id: string
  start_date: string
  end_date: string | null
}