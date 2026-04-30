/**
 * Tipos relacionados ao fluxo de convite e onboarding de responsáveis.
 */

export type Convite = {
  id: string
  escola_id: string
  usuario_id: string
  token: string
  expira_em: string
  usado_em: string | null  // null = convite ainda não utilizado
  criado_por: string | null
  criado_em: string
}