'use server'

/**
 * activateGuardian — Server Action chamada na página /convite/[token].
 *
 * Fluxo:
 * 1. Valida o token — existe, não expirou, não foi usado
 * 2. Busca o responsável pelo user_id do convite
 * 3. Valida o CPF — compara com o hash salvo
 * 4. Cria o usuário no Supabase Auth usando o mesmo id já existente
 *    na tabela `users` — evita precisar atualizar a PK
 * 5. Marca o convite como usado
 *
 * Após isso o responsável pode fazer login com o email fictício e a senha.
 */

import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase-admin'

type ActivateGuardianInput = {
  token: string
  cpf: string
  password: string
}

type ActivateGuardianResult =
  | { ok: true }
  | { ok: false; error: string }

export async function activateGuardian(
  input: ActivateGuardianInput
): Promise<ActivateGuardianResult> {
  const supabase = createAdminClient()

  // ── 1. Valida o token ──
  const { data: invite } = await supabase
    .from('invites')
    .select('id, user_id, expires_at, used_at')
    .eq('token', input.token)
    .single()

  if (!invite) return { ok: false, error: 'Link inválido. Peça um novo à escola.' }
  if (invite.used_at) return { ok: false, error: 'Esse link já foi usado.' }
  if (new Date(invite.expires_at) < new Date()) return { ok: false, error: 'Link expirado. Peça um novo à escola.' }

  // ── 2. Busca o responsável ──
  const { data: user } = await supabase
    .from('users')
    .select('id, phone, cpf_hash')
    .eq('id', invite.user_id)
    .single()

  if (!user) return { ok: false, error: 'Usuário não encontrado.' }

  // ── 3. Valida o CPF ──
  const cleanCpf = input.cpf.replace(/\D/g, '')

  if (!user.cpf_hash) return { ok: false, error: 'CPF não cadastrado. Contate a escola.' }

  const validCpf = await bcrypt.compare(cleanCpf, user.cpf_hash)
  if (!validCpf) return { ok: false, error: 'CPF incorreto. Verifique e tente novamente.' }

  // ── 4. Cria usuário no Auth com o mesmo id da tabela users ──
  const fictionalEmail = `${user.phone}@agendazero.internal`

  const { error: authError } = await supabase.auth.admin.createUser({
    id: user.id,         // usa o mesmo UUID já existente na tabela
    email: fictionalEmail,
    password: input.password,
    email_confirm: true,
  })

  if (authError) {
    console.error('Erro ao criar usuário no Auth:', authError)
    return { ok: false, error: 'Erro ao criar acesso. Tente novamente.' }
  }

  // ── 5. Marca o convite como usado ──
  await supabase
    .from('invites')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invite.id)

  return { ok: true }
}