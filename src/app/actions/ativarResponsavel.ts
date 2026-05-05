'use server'

/**
 * ativarResponsavel — Server Action chamada na página /convite/[token].
 *
 * Fluxo:
 * 1. Valida o token — existe, não expirou, não foi usado
 * 2. Busca o responsável pelo usuario_id do convite
 * 3. Valida o CPF — compara com o hash salvo
 * 4. Cria o usuário no Supabase Auth usando o mesmo id já existente
 *    na tabela `usuarios` — evita precisar atualizar a PK
 * 5. Marca o convite como usado
 *
 * Após isso o responsável pode fazer login com o email fictício e a senha.
 */

import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase-admin'

type AtivarResponsavelInput = {
  token: string
  cpf: string
  senha: string
}

type AtivarResponsavelResult =
  | { ok: true }
  | { ok: false; erro: string }

export async function ativarResponsavel(
  input: AtivarResponsavelInput
): Promise<AtivarResponsavelResult> {
  const supabase = createAdminClient()

  // ── 1. Valida o token ──
  const { data: convite } = await supabase
    .from('convites')
    .select('id, usuario_id, expira_em, usado_em')
    .eq('token', input.token)
    .single()

  if (!convite) return { ok: false, erro: 'Link inválido. Peça um novo à escola.' }
  if (convite.usado_em) return { ok: false, erro: 'Esse link já foi usado.' }
  if (new Date(convite.expira_em) < new Date()) return { ok: false, erro: 'Link expirado. Peça um novo à escola.' }

  // ── 2. Busca o responsável ──
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, telefone, cpf_hash')
    .eq('id', convite.usuario_id)
    .single()

  if (!usuario) return { ok: false, erro: 'Usuário não encontrado.' }

  // ── 3. Valida o CPF ──
  const cpfLimpo = input.cpf.replace(/\D/g, '')

  if (!usuario.cpf_hash) return { ok: false, erro: 'CPF não cadastrado. Contate a escola.' }

  const cpfValido = await bcrypt.compare(cpfLimpo, usuario.cpf_hash)
  if (!cpfValido) return { ok: false, erro: 'CPF incorreto. Verifique e tente novamente.' }

  // ── 4. Cria usuário no Auth com o mesmo id da tabela usuarios ──
  const emailFicticio = `${usuario.telefone}@agendazero.internal`

  const { error: erroAuth } = await supabase.auth.admin.createUser({
    id: usuario.id,         // usa o mesmo UUID já existente na tabela
    email: emailFicticio,
    password: input.senha,
    email_confirm: true,
  })

  if (erroAuth) {
    console.error('Erro ao criar usuário no Auth:', erroAuth)
    return { ok: false, erro: 'Erro ao criar acesso. Tente novamente.' }
  }

  // ── 5. Marca o convite como usado ──
  await supabase
    .from('convites')
    .update({ usado_em: new Date().toISOString() })
    .eq('id', convite.id)

  return { ok: true }
}