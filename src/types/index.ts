/**
 * Ponto central de exportação de todos os tipos do projeto.
 * Importe sempre daqui: import type { Crianca, Turma } from '@/types'
 */

export type { Escola, Usuario, Role } from './escola'

export type { Turma, CriancaTurma, Turno, TipoTurma } from './turma'

export type {
  Crianca,
  Vinculo,
  TipoVinculo,
  RelacaoVinculo,
} from './crianca'

export type {
  RegistroDiario,
  RegistroPresenca,
  RegistroAlimentacao,
  RegistroHigiene,
  ResumoDiario,
  Humor,
  Sono,
  Refeicao,
  Aceitacao,
} from './rotina'

export type {
  Ocorrencia,
  OcorrenciaAnexo,
  OcorrenciaLeitura,
  StatusOcorrencia,
} from './ocorrencia'

export type {
  Comunicado,
  ComunicadoAnexo,
  ComunicadoLeitura,
  Cardapio,
  EscopoComunicado,
  TipoAnexo,
} from './comunicado'

export type { Convite } from './convite'

export type { Sessao, ResultadoAuth } from './auth'