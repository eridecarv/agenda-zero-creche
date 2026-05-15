/**
 * TimelineItem — exemplos de uso
 *
 * Este arquivo documenta todos os casos de uso do componente TimelineItem.
 * Não é importado em nenhuma página — serve como referência para
 * quem for usar ou manter o componente.
 */

import { TimelineItem } from './TimelineItem'

export function TimelineItemExamples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 24 }}>

      {/* ── Entrada ── */}
      <TimelineItem
        icon="🚪"
        iconBg="#EAF3DE"
        time="08:00"
        title="Entrada"
        description="Chegou sorridente e foi direto encontrar a turma."
        badge={{ label: 'Presença', color: '#EAF3DE', textColor: '#3B6D11' }}
      />

      {/* ── Alimentação ── */}
      <TimelineItem
        icon="🍽"
        iconBg="#FAEEDA"
        time="12:30"
        title="Almoço"
        description="Boa aceitação"
        badge={{ label: 'Alimentação', color: '#FAEEDA', textColor: '#854F0B' }}
      />

      {/* ── Sono ── */}
      <TimelineItem
        icon="🌙"
        iconBg="#EEEDFE"
        time="13:00"
        title="Soninho"
        description="Dormiu bem"
        badge={{ label: 'Sono', color: '#EEEDFE', textColor: '#534AB7' }}
      />

      {/* ── Higiene ── */}
      <TimelineItem
        icon="🛁"
        iconBg="#E1F5EE"
        time="14:00"
        title="Higiene"
        description="Banho · Escovação"
        badge={{ label: 'Higiene', color: '#E1F5EE', textColor: '#0F6E56' }}
      />

      {/* ── Saída com expandível ── */}
      <TimelineItem
        icon="🏠"
        iconBg="#FAF7F2"
        time="17:24"
        title="Saída"
        description="Sofia saiu com seu pai"
        expandable
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, color: '#3A2E24' }}>João Silva — pai</p>
          <p style={{ margin: 0, fontSize: 11, color: '#8C7060' }}>Registrado pela Profa. Ana</p>
        </div>
      </TimelineItem>

    </div>
  )
}