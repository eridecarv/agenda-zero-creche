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
        mood="contente"
        dayComplete
        updatedAt="17:05"
        metrics={[
          { label: 'ENTRADA', value: '07:42' },
          { label: 'SAÍDA', value: '17:05' },
          { label: 'HUMOR', value: '😊' },
        ]}
        onViewFullSchedule={() => alert('Ver agenda completa')}
        text={
          <>
            Sofia comeu bem, repetiu na hora do almoço. Fez coco, tomou banho. De tarde ficou meio amoada —{' '}
            <ExpandableText
              text="dormiu pouco"
              detail="Cochilou menos de meia hora de manhã e um pouquinho depois do almoço, mas ficou inquieta."
              author="Profa. Ana · 14:05"
            />
            .
          </>
        }
      />

      {/* ── Dia em andamento ── */}
      <NarrativeCard
        mood="tranquilo"
        dayComplete={false}
        updatedAt="10:15"
        metrics={[
          { label: 'ENTRADA', value: '07:42' },
          { label: 'SAÍDA', value: '—' },
          { label: 'HUMOR', value: '😌' },
        ]}
        text="Sofia chegou bem disposta e já tomou o café da manhã."
      />

      {/* ── Sem humor ── */}
      <NarrativeCard
        dayComplete
        updatedAt="17:00"
        metrics={[
          { label: 'ENTRADA', value: '08:00' },
          { label: 'SAÍDA', value: '17:00' },
        ]}
        text="Lara teve um dia tranquilo. Comeu bem e dormiu direitinho."
      />

    </div>
  )
}