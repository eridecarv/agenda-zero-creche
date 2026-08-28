'use server'

/**
 * registerGuardian — Server Action para cadastro de responsável.
 *
 * Roda no servidor — tem acesso ao cliente admin do Supabase.
 *
 * Fluxo:
 * 1. Faz hash do CPF com bcrypt
 * 2. Insere o responsável na tabela `users` (sem usuário no Auth ainda)
 * 3. Insere o vínculo na tabela `guardianships`
 * 4. Gera token de convite e insere em `invites`
 * 5. Retorna o token do convite (link montado no frontend)
 *
 * O usuário no Auth só é criado quando o responsável
 * clica no link e cria a senha na página /convite/[token].
 *
 * LIMITAÇÕES CONHECIDAS:
 * - Rollback manual não é transacional — em falha dupla pode gerar usuário órfão
 * - Token retornado ao cliente — em produção, envio automático via WhatsApp é mais seguro
 */

import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase-admin'

type RegisterGuardianInput = {
  schoolId: string
  registeredBy: string
  name: string
  phone: string
  cpf: string
  childId: string
  relation: string
}

type RegisterGuardianResult =
  { ok: true; token: string; userId: string } | { ok: false; error: string }

export async function registerGuardian(
  input: RegisterGuardianInput
): Promise<RegisterGuardianResult> {
  try {
    const supabase = createAdminClient()

    // ── 1. Hash do CPF ──
    const cleanCpf = input.cpf.replace(/\D/g, '')
    if (cleanCpf.length !== 11) {
      return { ok: false, error: 'CPF inválido.' }
    }
    const cpfHash = await bcrypt.hash(cleanCpf, 12)

    // ── 2. Insere o responsável em `users` ──
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        school_id: input.schoolId,
        name: input.name.trim(),
        phone: input.phone.replace(/\D/g, '') || null,
        cpf_hash: cpfHash,
        role: 'guardian',
        active: true,
      })
      .select('id')
      .single()

    if (userError || !newUser) {
      console.error('Erro ao inserir usuario:', userError)
      return { ok: false, error: 'Erro ao cadastrar responsável.' }
    }

    // ── 3. Insere vínculo com a criança ──
    const { error: guardianshipError } = await supabase.from('guardianships').insert({
      school_id: input.schoolId,
      child_id: input.childId,
      user_id: newUser.id,
      type: 'principal',
      relation: input.relation,
      added_by: input.registeredBy,
      start_date: new Date().toISOString().split('T')[0],
    })

    if (guardianshipError) {
      const { error: deleteError } = await supabase.from('users').delete().eq('id', newUser.id)

      if (deleteError) {
        console.error('ROLLBACK FALHOU — usuário órfão criado:', {
          userId: newUser.id,
          guardianshipError,
          deleteError,
        })
        return {
          ok: false,
          error: `Erro ao vincular. Código: ${newUser.id.slice(0, 8)}`,
        }
      }

      return { ok: false, error: 'Erro ao vincular responsável à criança.' }
    }

    // ── 4. Gera token de convite ──
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

    const { error: inviteError } = await supabase.from('invites').insert({
      school_id: input.schoolId,
      user_id: newUser.id,
      token,
      expires_at: expiresAt,
      created_by: input.registeredBy,
    })

    if (inviteError) {
      return { ok: false, error: 'Erro ao gerar convite.' }
    }

    // ── 5. Retorna o token (link montado no frontend) ──
    return { ok: true, token, userId: newUser.id }
  } catch (error) {
    console.error('[registerGuardian]', error)
    return { ok: false, error: 'Erro interno. Tente novamente.' }
  }
}
