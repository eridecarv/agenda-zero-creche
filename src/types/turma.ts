/**
 * Tipos relacionados a turmas e suas classificações.
 */

export type Shift =
  | 'manha'
  | 'tarde'
  | 'integral'
  | 'noite'

export type ClassType =
  | 'regular'
  | 'extracurricular'

export type Class = {
  id: string
  school_id: string
  name: string
  level: string | null
  shift: Shift | null
  type: ClassType
  year: number
  active: boolean
  created_at: string
  deactivated_at: string | null
}

export type ChildClass = {
  id: string
  child_id: string
  class_id: string
  start_date: string
  end_date: string | null
}