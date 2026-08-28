'use server'

/**
 * createIncident — Server Action para criação de ocorrência.
 *
 * Fluxo:
 * 1. Se houver foto, faz o upload primeiro
 * 2. Só após o upload bem-sucedido, insere a ocorrência no banco
 * 3. Insere o registro do anexo em incident_attachments
 *
 * Essa ordem elimina a necessidade de rollback manual —
 * o banco só é tocado quando tudo já deu certo.
 *
 * Apenas professores, coordenadores e admins podem criar ocorrências.
 * A ocorrência não é enviada ao responsável neste momento.
 */

import { createAdminClient } from '@/lib/supabase-admin'

type CreateIncidentInput = {
  schoolId: string
  childId: string
  recordedBy: string
  title: string
  description: string
  attachment?: {
    name: string
    type: string
    bytes: number[]
  } | null
}

type CreateIncidentResult = { ok: true; incidentId: string } | { ok: false; error: string }

export async function createIncident(input: CreateIncidentInput): Promise<CreateIncidentResult> {
  try {
    const supabase = createAdminClient()

    // ── Validações básicas ──
    if (!input.title.trim()) return { ok: false, error: 'Título obrigatório.' }
    if (!input.description.trim()) return { ok: false, error: 'Descrição obrigatória.' }

    let attachmentUrl: string | null = null
    let attachmentFileName: string | null = null
    let attachmentSize: number | null = null

    // ── 1. Upload da foto ANTES de inserir no banco ──
    if (input.attachment) {
      const { name, type, bytes } = input.attachment

      // Valida tipo (apenas imagens)
      if (!type.startsWith('image/')) {
        return {
          ok: false,
          error: 'Apenas imagens são permitidas como anexo.',
        }
      }

      // Valida tamanho (5MB)
      if (bytes.length > 5 * 1024 * 1024) {
        return { ok: false, error: 'A imagem deve ter no máximo 5MB.' }
      }

      const extension = name.split('.').pop()
      const tempId = crypto.randomUUID()
      const fileName = `${input.schoolId}/${tempId}.${extension}`
      const file = new Uint8Array(bytes)

      const { error: uploadError } = await supabase.storage
        .from('incident-attachments')
        .upload(fileName, file, {
          contentType: type,
          upsert: false,
        })

      if (uploadError) {
        console.error('[createIncident] erro no upload:', uploadError)
        return {
          ok: false,
          error: 'Erro ao enviar a foto. A ocorrência não foi registrada. Tente novamente.',
        }
      }

      const { data: urlData } = supabase.storage.from('incident-attachments').getPublicUrl(fileName)

      attachmentUrl = urlData.publicUrl
      attachmentFileName = name
      attachmentSize = bytes.length
    }

    // ── 2. Insere a ocorrência — só chega aqui se upload ok ──
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .insert({
        school_id: input.schoolId,
        child_id: input.childId,
        title: input.title.trim(),
        description: input.description.trim(),
        status: 'draft',
        recorded_by: input.recordedBy,
      })
      .select('id')
      .single()

    if (incidentError || !incident) {
      console.error('[createIncident] erro ao inserir:', JSON.stringify(incidentError))
      return {
        ok: false,
        error: incidentError?.message ?? 'Erro ao registrar ocorrência.',
      }
    }

    // ── 3. Insere o anexo se houver ──
    if (attachmentUrl) {
      const { error: attachmentError } = await supabase.from('incident_attachments').insert({
        incident_id: incident.id,
        url: attachmentUrl,
        file_name: attachmentFileName,
        size_bytes: attachmentSize,
      })

      if (attachmentError) {
        console.error('[createIncident] erro ao salvar anexo:', attachmentError)
      }
    }

    return { ok: true, incidentId: incident.id }
  } catch (error) {
    console.error('[createIncident]', error)
    return { ok: false, error: 'Erro interno. Tente novamente.' }
  }
}
