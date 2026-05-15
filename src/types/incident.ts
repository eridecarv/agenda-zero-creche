/**
 * Tipos relacionados a ocorrências e seu fluxo de validação.
 */

export type IncidentStatus =
  | 'rascunho'
  | 'pendente'
  | 'enviado'

export type Incident = {
  id: string
  school_id: string
  child_id: string
  title: string
  description: string
  original_description: string | null  // preserva o texto original caso a coordenação edite
  status: IncidentStatus
  recorded_by: string | null
  edited_by: string | null
  sent_by: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

export type IncidentAttachment = {
  id: string
  incident_id: string
  url: string
  file_name: string | null
  size_bytes: number | null
  created_at: string
}

export type IncidentRead = {
  id: string
  incident_id: string
  user_id: string
  read_at: string
}