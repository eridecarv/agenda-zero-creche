'use server'

/**
 * verifyCpf — verifica se já existe responsável com esse CPF.
 *
 * Bcrypt não permite busca direta no banco — o hash é diferente
 * a cada vez que é gerado. Por isso precisamos buscar todos os
 * responsáveis da escola e comparar o CPF com cada hash.
 *
 * Retorna o responsável encontrado ou null.
 */

import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase-admin'

type VerifyCpfInput = {
  cleanCpf: string
  schoolId: string
}

type GuardianFound = {
  id: string
  name: string
  hasActiveAccount: boolean
} | null

export async function verifyCpf(
  input: VerifyCpfInput
): Promise<GuardianFound> {
  try {
    const supabase = createAdminClient()

    const { data: guardians } = await supabase
      .from('users')
      .select('id, name, cpf_hash')
      .eq('school_id', input.schoolId)
      .eq('role', 'guardian')
      .eq('active', true)
      .not('cpf_hash', 'is', null)

    if (!guardians || guardians.length === 0) return null

    for (const guardian of guardians) {
      if (!guardian.cpf_hash) continue
      const matches = await bcrypt.compare(input.cleanCpf, guardian.cpf_hash)
      if (matches) {
        // Verifica se já tem conta ativa no Auth
        const { data: authUser } = await supabase.auth.admin.getUserById(guardian.id)
        return {
          id: guardian.id,
          name: guardian.name,
          hasActiveAccount: !!authUser?.user,
        }
      }
    }

    return null
  } catch (error) {
    console.error('[verifyCpf]', error)
    return null
  }
}