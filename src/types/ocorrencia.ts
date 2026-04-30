/**
 * Tipos relacionados a ocorrências e seu fluxo de validação.
 */

export type StatusOcorrencia =
  | 'rascunho'
  | 'pendente'
  | 'enviado'

export type Ocorrencia = {
  id: string
  escola_id: string
  crianca_id: string
  titulo: string
  descricao: string
  descricao_original: string | null  // preserva o texto original caso a coordenação edite
  status: StatusOcorrencia
  registrado_por: string | null
  editado_por: string | null
  enviado_por: string | null
  enviado_em: string | null
  criado_em: string
  atualizado_em: string
}

export type OcorrenciaAnexo = {
  id: string
  ocorrencia_id: string
  url: string
  nome_arquivo: string | null
  tamanho_bytes: number | null
  criado_em: string
}

export type OcorrenciaLeitura = {
  id: string
  ocorrencia_id: string
  usuario_id: string
  lido_em: string
}