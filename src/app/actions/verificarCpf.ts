'use server'

/**
 * verificarCpfResponsavel — verifica se já existe responsável com esse CPF.
 *
 * Bcrypt não permite busca direta no banco — o hash é diferente
 * a cada vez que é gerado. Por isso precisamos buscar todos os
 * responsáveis da escola e comparar o CPF com cada hash.
 *
 * Retorna o responsável encontrado ou null.
 */

import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase-admin'

type VerificarCpfInput = {
  cpfLimpo: string
  escolaId: string
}

type ResponsavelEncontrado = {
  id: string
  nome: string
  temContaAtiva: boolean
} | null

export async function verificarCpfResponsavel(
  input: VerificarCpfInput
): Promise<ResponsavelEncontrado> {
  const supabase = createAdminClient()

  const { data: responsaveis } = await supabase
    .from('usuarios')
    .select('id, nome, cpf_hash')
    .eq('escola_id', input.escolaId)
    .eq('role', 'responsavel')
    .eq('ativo', true)
    .not('cpf_hash', 'is', null)

  if (!responsaveis || responsaveis.length === 0) return null

  for (const r of responsaveis) {
    if (!r.cpf_hash) continue
    const bate = await bcrypt.compare(input.cpfLimpo, r.cpf_hash)
    if (bate) {
      // Verifica se já tem conta ativa no Auth
      const { data: authUser } = await supabase.auth.admin.getUserById(r.id)
      return {
        id: r.id,
        nome: r.nome,
        temContaAtiva: !!authUser?.user,
      }
    }
  }

  return null
}