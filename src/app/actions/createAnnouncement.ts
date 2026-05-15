'use server'

/**
 * createAnnouncement — Server Action para criação de comunicado.
 *
 * Fluxo:
 * 1. Insere o comunicado na tabela `announcements`
 * 2. Se houver anexo, faz upload no Storage e insere em `announcement_attachments`
 *
 * O upload é feito no servidor via admin client para contornar
 * as políticas de RLS do Storage.
 */

import { createAdminClient } from '@/lib/supabase-admin'

type CreateAnnouncementInput = {
  schoolId: string
  publishedBy: string
  title: string
  content: string
  scope: 'turma' | 'turno' | 'escola'
  classId?: string | null
  shift?: string | null
  attachment?: {
    name: string
    type: string
    bytes: number[]
  } | null
}

type CreateAnnouncementResult =
  | { ok: true; announcementId: string }
  | { ok: false; error: string }

export async function createAnnouncement(
  input: CreateAnnouncementInput
): Promise<CreateAnnouncementResult> {
  try {
    const supabase = createAdminClient()

    // ── 1. Insere o comunicado ──
    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .insert({
        school_id: input.schoolId,
        title: input.title.trim(),
        content: input.content.trim(),
        scope: input.scope,
        class_id: input.classId ?? null,
        shift: input.shift ?? null,
        published_by: input.publishedBy,
      })
      .select('id')
      .single()

    if (announcementError || !announcement) {
      console.error('[createAnnouncement] erro ao inserir:', announcementError)
      return { ok: false, error: 'Erro ao criar comunicado.' }
    }

    // ── 2. Upload do anexo se houver ──
    if (input.attachment) {
      const { name, type, bytes } = input.attachment

      // Valida tamanho (5MB)
      if (bytes.length > 5 * 1024 * 1024) {
        return { ok: false, error: 'O arquivo deve ter no máximo 5MB.' }
      }

      const extension = name.split('.').pop()
      const fileName = `${input.schoolId}/${announcement.id}.${extension}`
      const file = new Uint8Array(bytes)

      const { error: uploadError } = await supabase.storage
        .from('comunicado-anexo')
        .upload(fileName, file, {
          contentType: type,
          upsert: false,
        })

      if (uploadError) {
        console.error('[createAnnouncement] erro no upload:', uploadError)
        // Não cancela o comunicado por falha no anexo — registra e segue
        return { ok: true, announcementId: announcement.id }
      }

      const { data: urlData } = supabase.storage
        .from('comunicado-anexo')
        .getPublicUrl(fileName)

      const { error: attachmentError } = await supabase
        .from('announcement_attachments')
        .insert({
          announcement_id: announcement.id,
          type: type.startsWith('image/') ? 'imagem' : 'pdf',
          url: urlData.publicUrl,
          file_name: name,
          size_bytes: bytes.length,
          display_order: 1,
        })

      if (attachmentError) {
        console.error('[createAnnouncement] erro ao salvar anexo:', attachmentError)
      }
    }

    return { ok: true, announcementId: announcement.id }

  } catch (error) {
    console.error('[createAnnouncement]', error)
    return { ok: false, error: 'Erro interno. Tente novamente.' }
  }
}