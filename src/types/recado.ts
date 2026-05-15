/**
 * Tipos relacionados a recados enviados por colaboradores
 * diretamente aos responsáveis de uma criança específica.
 *
 * Diferente do comunicado (formal, coordenação → escola/turma),
 * o recado é informal e direto: professor → responsável.
 * Não passa por aprovação.
 */

export type Message = {
  id: string
  school_id: string
  child_id: string
  sent_by: string
  content: string
  read: boolean
  read_at: string | null
  created_at: string
}