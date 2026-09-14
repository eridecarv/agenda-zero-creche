'use server'

/**
 * markIncidentRead — Server Action para confirmação de leitura pelo responsável.
 *
 * Registra na tabela `incident_reads` que o responsável leu a ocorrência.
 * Operação idempotente — se já foi lida, não duplica o registro.
 */

import { createAdminClient } from '@/lib/supabase-admin'

type MarkIncidentReadInput = {
  incidentId: string
  userId: string
}

type MarkIncidentReadResult = { ok: true } | { ok: false; error: string }

export async function markIncidentRead(
  input: MarkIncidentReadInput
): Promise<MarkIncidentReadResult> {
  try {
    const supabase = createAdminClient()

    // ── Verifica se já foi marcado como lido ──
    const { data: existing } = await supabase
      .from('incident_reads')
      .select('id')
      .eq('incident_id', input.incidentId)
      .eq('user_id', input.userId)
      .single()

    if (existing) return { ok: true } // já lido, idempotente

    // ── Registra leitura ──
    const { error } = await supabase.from('incident_reads').insert({
      incident_id: input.incidentId,
      user_id: input.userId,
      read_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[markIncidentRead] erro ao registrar leitura:', error)
      return { ok: false, error: 'Erro ao confirmar leitura.' }
    }

    return { ok: true }
  } catch (error) {
    console.error('[markIncidentRead]', error)
    return { ok: false, error: 'Erro interno. Tente novamente.' }
  }
}
