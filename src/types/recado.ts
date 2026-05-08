/**
 * Tipos relacionados a recados enviados por colaboradores
 * diretamente aos responsáveis de uma criança específica.
 *
 * Diferente do comunicado (formal, coordenação → escola/turma),
 * o recado é informal e direto: professor → responsável.
 * Não passa por aprovação.
 */

export type Recado = {
  id: string
  escola_id: string
  crianca_id: string
  enviado_por: string
  mensagem: string
  lido: boolean
  lido_em: string | null
  criado_em: string
}