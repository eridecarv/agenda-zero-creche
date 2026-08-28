'use server'

/**
 * updateIncident — Server Action para edição de ocorrência.
 *
 * Apenas coordenadores e admins podem editar.
 * O texto original é preservado em `original_description`
 * na primeira edição, para auditoria.
 */

import { createAdminClient } from '@/lib/supabase-admin'

type UpdateIncidentInput = {
  incidentId: string
  editedBy: string
  title: string
  description: string
}

type UpdateIncidentResult = { ok: true } | { ok: false; error: string }

export async function updateIncident(input: UpdateIncidentInput): Promise<UpdateIncidentResult> {
  try {
    const supabase = createAdminClient()

    if (!input.title.trim()) return { ok: false, error: 'Título obrigatório.' }
    if (!input.description.trim()) return { ok: false, error: 'Descrição obrigatória.' }

    // ── Busca ocorrência atual para preservar original ──
    const { data: current, error: fetchError } = await supabase
      .from('incidents')
      .select('description, original_description, status')
      .eq('id', input.incidentId)
      .single()

    if (fetchError || !current) {
      return { ok: false, error: 'Ocorrência não encontrada.' }
    }

    if (current.status === 'sent') {
      return { ok: false, error: 'Ocorrência já enviada não pode ser editada.' }
    }

    // ── Atualiza preservando o texto original na primeira edição ──
    const { error: updateError } = await supabase
      .from('incidents')
      .update({
        title: input.title.trim(),
        description: input.description.trim(),
        original_description: current.original_description ?? current.description,
        edited_by: input.editedBy,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.incidentId)

    if (updateError) {
      console.error('[updateIncident] erro ao atualizar:', updateError)
      return { ok: false, error: 'Erro ao atualizar ocorrência.' }
    }

    return { ok: true }
  } catch (error) {
    console.error('[updateIncident]', error)
    return { ok: false, error: 'Erro interno. Tente novamente.' }
  }
}
