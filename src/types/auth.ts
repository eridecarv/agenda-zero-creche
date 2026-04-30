/**
 * Tipos relacionados à autenticação e sessão do usuário.
 * Combina dados do Supabase Auth com dados da tabela usuarios.
 */

import type { Role } from './escola'

// Dados da sessão disponíveis em toda a aplicação
export type Sessao = {
  usuario_id: string
  escola_id: string
  nome: string
  role: Role
}

// Retorno padrão de ações de autenticação
export type ResultadoAuth =
  | { sucesso: true; sessao: Sessao }
  | { sucesso: false; erro: string }