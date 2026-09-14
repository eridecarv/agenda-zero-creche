/**
 * Tipos relacionados à autenticação e sessão do usuário.
 * Combina dados do Supabase Auth com dados da tabela users.
 */

import type { Role } from './school'

// Dados da sessão disponíveis em toda a aplicação
export type Session = {
  user_id: string
  school_id: string
  name: string
  role: Role
}

// Retorno padrão de ações de autenticação
export type AuthResult = { success: true; session: Session } | { success: false; error: string }
