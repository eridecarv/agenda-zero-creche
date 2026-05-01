/**
 * NarrativeCard — exemplos de uso
 *
 * Este arquivo documenta todos os casos de uso do componente NarrativeCard.
 * Não é importado em nenhuma página — serve como referência para
 * quem for usar ou manter o componente.
 */

import { NarrativeCard } from './NarrativeCard'
import { ExpandableText } from './ExpandableText'

export function NarrativeCardExamples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>

      {/* ── Dia concluído ── */}
      <NarrativeCard
        humor="contente"
        diaConcluido
        atualizadoEm="17:05"
        metricas={[
          { label: 'ENTRADA', valor: '07:42' },
          { label: 'SAÍDA', valor: '17:05' },
          { label: 'HUMOR', valor: '😊' },
        ]}
        onVerAgendaCompleta={() => alert('Ver agenda completa')}
        texto={
          <>
            Sofia comeu bem, repetiu na hora do almoço. Fez coco, tomou banho. De tarde ficou meio amoada —{' '}
            <ExpandableText
              texto="dormiu pouco"
              detalhe="Cochilou menos de meia hora de manhã e um pouquinho depois do almoço, mas ficou inquieta."
              autor="Profa. Ana · 14:05"
            />
            .
          </>
        }
      />

      {/* ── Dia em andamento ── */}
      <NarrativeCard
        humor="tranquilo"
        diaConcluido={false}
        atualizadoEm="10:15"
        metricas={[
          { label: 'ENTRADA', valor: '07:42' },
          { label: 'SAÍDA', valor: '—' },
          { label: 'HUMOR', valor: '😌' },
        ]}
        texto="Sofia chegou bem disposta e já tomou o café da manhã."
      />

      {/* ── Sem humor ── */}
      <NarrativeCard
        diaConcluido
        atualizadoEm="17:00"
        metricas={[
          { label: 'ENTRADA', valor: '08:00' },
          { label: 'SAÍDA', valor: '17:00' },
        ]}
        texto="Lara teve um dia tranquilo. Comeu bem e dormiu direitinho."
      />

    </div>
  )
}