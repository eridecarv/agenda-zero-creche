/**
 * Tipos relacionados a comunicados, cardápio e seus anexos.
 */

import type { Nivel, Turno } from './turma'

export type EscopoComunicado =
  | 'turma'
  | 'nivel'
  | 'turno'
  | 'escola'

export type TipoAnexo =
  | 'imagem'
  | 'pdf'
  | 'outro'

export type Comunicado = {
  id: string
  escola_id: string
  titulo: string
  conteudo: string
  escopo: EscopoComunicado
  turma_id: string | null
  nivel: Nivel | null
  turno: Turno | null
  publicado_por: string | null
  criado_em: string
}

export type ComunicadoAnexo = {
  id: string
  comunicado_id: string
  tipo: TipoAnexo | null
  url: string
  nome_arquivo: string | null
  tamanho_bytes: number | null
  ordem: number
  criado_em: string
}

export type ComunicadoLeitura = {
  id: string
  comunicado_id: string
  usuario_id: string
  lido_em: string
}

export type Cardapio = {
  id: string
  escola_id: string
  turma_id: string | null
  semana_inicio: string
  segunda: string | null
  terca: string | null
  quarta: string | null
  quinta: string | null
  sexta: string | null
  criado_por: string | null
  criado_em: string
}