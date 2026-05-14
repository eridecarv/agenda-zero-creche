'use server'

/**
 * criarComunicado — Server Action para criação de comunicado.
 *
 * Fluxo:
 * 1. Insere o comunicado na tabela `comunicados`
 * 2. Se houver anexo, faz upload no Storage e insere em `comunicados_anexos`
 *
 * O upload é feito no servidor via admin client para contornar
 * as políticas de RLS do Storage.
 */

import { createAdminClient } from '@/lib/supabase-admin'

type CriarComunicadoInput = {
  escolaId: string
  publicadoPor: string
  titulo: string
  conteudo: string
  escopo: 'turma' | 'turno' | 'escola'
  turmaId?: string | null
  turno?: string | null
  anexo?: {
    nome: string
    tipo: string
    bytes: number[]
  } | null
}

type CriarComunicadoResult =
  | { ok: true; comunicadoId: string }
  | { ok: false; erro: string }

export async function criarComunicado(
  input: CriarComunicadoInput
): Promise<CriarComunicadoResult> {
  try {
    const supabase = createAdminClient()

    // ── 1. Insere o comunicado ──
    const { data: comunicado, error: erroComunicado } = await supabase
      .from('comunicados')
      .insert({
        escola_id: input.escolaId,
        titulo: input.titulo.trim(),
        conteudo: input.conteudo.trim(),
        escopo: input.escopo,
        turma_id: input.turmaId ?? null,
        turno: input.turno ?? null,
        publicado_por: input.publicadoPor,
      })
      .select('id')
      .single()

    if (erroComunicado || !comunicado) {
      console.error('[criarComunicado] erro ao inserir:', erroComunicado)
      return { ok: false, erro: 'Erro ao criar comunicado.' }
    }

    // ── 2. Upload do anexo se houver ──
    if (input.anexo) {
      const { nome, tipo, bytes } = input.anexo

      // Valida tamanho (5MB)
      if (bytes.length > 5 * 1024 * 1024) {
        return { ok: false, erro: 'O arquivo deve ter no máximo 5MB.' }
      }

      const extensao = nome.split('.').pop()
      const nomeArquivo = `${input.escolaId}/${comunicado.id}.${extensao}`
      const arquivo = new Uint8Array(bytes)

      const { error: erroUpload } = await supabase.storage
        .from('comunicado-anexo')
        .upload(nomeArquivo, arquivo, {
          contentType: tipo,
          upsert: false,
        })

      if (erroUpload) {
        console.error('[criarComunicado] erro no upload:', erroUpload)
        // Não cancela o comunicado por falha no anexo — registra e segue
        return { ok: true, comunicadoId: comunicado.id }
      }

      const { data: urlData } = supabase.storage
        .from('comunicado-anexo')
        .getPublicUrl(nomeArquivo)

      const { error: erroAnexo } = await supabase
        .from('comunicados_anexos')
        .insert({
          comunicado_id: comunicado.id,
          tipo: tipo.startsWith('image/') ? 'imagem' : 'pdf',
          url: urlData.publicUrl,
          nome_arquivo: nome,
          tamanho_bytes: bytes.length,
          ordem: 1,
        })

      if (erroAnexo) {
        console.error('[criarComunicado] erro ao salvar anexo:', erroAnexo)
      }
    }

    return { ok: true, comunicadoId: comunicado.id }

  } catch (error) {
    console.error('[criarComunicado]', error)
    return { ok: false, erro: 'Erro interno. Tente novamente.' }
  }
}