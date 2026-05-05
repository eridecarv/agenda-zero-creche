'use server'

/**
 * cadastrarResponsavel — Server Action para cadastro de responsável.
 *
 * Roda no servidor — tem acesso ao cliente admin do Supabase.
 *
 * Fluxo:
 * 1. Faz hash do CPF com bcrypt
 * 2. Insere o responsável na tabela `usuarios` (sem usuário no Auth ainda)
 * 3. Insere o vínculo na tabela `vinculos`
 * 4. Gera token de convite e insere em `convites`
 * 5. Retorna o link do convite
 *
 * O usuário no Auth só é criado quando o responsável
 * clica no link e cria a senha na página /convite/[token].
 */

import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase-admin'

type CadastrarResponsavelInput = {
  escolaId: string
  cadastradoPor: string       // id do adm logado
  nome: string
  telefone: string
  cpf: string                 // CPF em texto puro — será hasheado aqui
  criancaId: string
  relacao: string
}

type CadastrarResponsavelResult =
  | { ok: true; linkConvite: string; usuarioId: string }
  | { ok: false; erro: string }

export async function cadastrarResponsavel(
  input: CadastrarResponsavelInput
): Promise<CadastrarResponsavelResult> {
  const supabase = createAdminClient()

  // ── 1. Hash do CPF ──
  const cpfLimpo = input.cpf.replace(/\D/g, '')
  if (cpfLimpo.length !== 11) {
    return { ok: false, erro: 'CPF inválido.' }
  }
  const cpfHash = await bcrypt.hash(cpfLimpo, 10)

  // ── 2. Insere o responsável em `usuarios` ──
  const { data: novoUsuario, error: erroUsuario } = await supabase
    .from('usuarios')
    .insert({
      escola_id: input.escolaId,
      nome: input.nome.trim(),
      telefone: input.telefone.replace(/\D/g, '') || null,
      cpf_hash: cpfHash,
      role: 'responsavel',
      ativo: true,
    })
    .select('id')
    .single()

  if (erroUsuario || !novoUsuario) {
    console.error('Erro ao inserir usuario:', erroUsuario)
    return { ok: false, erro: 'Erro ao cadastrar responsável.' }
  }

  // ── 3. Insere vínculo com a criança ──
  const { error: erroVinculo } = await supabase
    .from('vinculos')
    .insert({
      escola_id: input.escolaId,
      crianca_id: input.criancaId,
      usuario_id: novoUsuario.id,
      tipo: 'principal',
      relacao: input.relacao,
      adicionado_por: input.cadastradoPor,
      data_inicio: new Date().toISOString().split('T')[0],
    })

  if (erroVinculo) {
    // Desfaz o insert do usuário para não deixar registro órfão
    await supabase.from('usuarios').delete().eq('id', novoUsuario.id)
    return { ok: false, erro: 'Erro ao vincular responsável à criança.' }
  }

  // ── 4. Gera token de convite ──
  const token = crypto.randomUUID().replace(/-/g, '')
  const expiraEm = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

  const { error: erroConvite } = await supabase
    .from('convites')
    .insert({
      escola_id: input.escolaId,
      usuario_id: novoUsuario.id,
      token,
      expira_em: expiraEm,
      criado_por: input.cadastradoPor,
    })

  if (erroConvite) {
    return { ok: false, erro: 'Erro ao gerar convite.' }
  }

  // ── 5. Retorna o link ──
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const linkConvite = `${baseUrl}/convite/${token}`

  return { ok: true, linkConvite, usuarioId: novoUsuario.id }
}