'use server'

/**
 * sendIncident — Server Action para envio de ocorrência ao responsável.
 *
 * Apenas coordenadores e admins podem enviar.
 * Muda o status para 'enviado' e registra quem enviou e quando.
 * Ocorrência enviada não pode ser editada ou reenviada.
 */

import { createAdminClient } from '@/lib/supabase-admin'

type SendIncidentInput = {
  incidentId: string
  sentBy: string
}

type SendIncidentResult =
  | { ok: true }
  | { ok: false; error: string }

export async function sendIncident(
  input: SendIncidentInput
): Promise<SendIncidentResult> {
  try {
    const supabase = createAdminClient()

    // ── Verifica status atual ──
    const { data: current, error: fetchError } = await supabase
      .from('incidents')
      .select('status')
      .eq('id', input.incidentId)
      .single()

    if (fetchError || !current) {
      return { ok: false, error: 'Ocorrência não encontrada.' }
    }

    if (current.status === 'sent') {
      return { ok: false, error: 'Ocorrência já foi enviada.' }
    }

    // ── Atualiza status para enviado ──
    const { error: updateError } = await supabase
      .from('incidents')
      .update({
        status: 'sent',
        sent_by: input.sentBy,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.incidentId)

    if (updateError) {
      console.error('[sendIncident] erro ao enviar:', updateError)
      return { ok: false, error: 'Erro ao enviar ocorrência.' }
    }

    return { ok: true }

  } catch (error) {
    console.error('[sendIncident]', error)
    return { ok: false, error: 'Erro interno. Tente novamente.' }
  }
}