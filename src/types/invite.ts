/**
 * Tipos relacionados ao fluxo de convite e onboarding de responsáveis.
 */

export type Invite = {
  id: string
  school_id: string
  user_id: string
  token: string
  expires_at: string
  used_at: string | null  // null = convite ainda não utilizado
  created_by: string | null
  created_at: string
}