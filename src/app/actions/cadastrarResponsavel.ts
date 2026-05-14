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

type CadastrarResponsavelInput = {
  escolaId: string
  cadastradoPor: string
  nome: string
  telefone: string
  cpf: string
  criancaId: string
  relacao: string
}

type CadastrarResponsavelResult =
  | { ok: true; token: string; usuarioId: string }
  | { ok: false; erro: string }

export async function cadastrarResponsavel(
  input: CadastrarResponsavelInput
): Promise<CadastrarResponsavelResult> {
  try {
    const supabase = createAdminClient()

    // ── 1. Hash do CPF ──
    const cpfLimpo = input.cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      return { ok: false, erro: 'CPF inválido.' }
    }
    const cpfHash = await bcrypt.hash(cpfLimpo, 12)

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
      const { error: erroDelete } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', novoUsuario.id)

      if (erroDelete) {
        console.error('ROLLBACK FALHOU — usuário órfão criado:', {
          usuarioId: novoUsuario.id,
          erroVinculo,
          erroDelete,
        })
        return {
          ok: false,
          erro: `Erro ao vincular. Código: ${novoUsuario.id.slice(0, 8)}`,
        }
      }

      return { ok: false, erro: 'Erro ao vincular responsável à criança.' }
    }

    // ── 4. Gera token de convite ──
    const token = crypto.randomUUID()
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

    // ── 5. Retorna o token (link montado no frontend) ──
    return { ok: true, token, usuarioId: novoUsuario.id }

  } catch (error) {
    console.error('[cadastrarResponsavel]', error)
    return { ok: false, erro: 'Erro interno. Tente novamente.' }
  }
}