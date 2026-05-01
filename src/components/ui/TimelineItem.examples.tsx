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
        icone="🚪"
        iconeBg="#EAF3DE"
        horario="08:00"
        titulo="Entrada"
        descricao="Chegou sorridente e foi direto encontrar a turma."
        badge={{ label: 'Presença', color: '#EAF3DE', textColor: '#3B6D11' }}
      />

      {/* ── Alimentação ── */}
      <TimelineItem
        icone="🍽"
        iconeBg="#FAEEDA"
        horario="12:30"
        titulo="Almoço"
        descricao="Boa aceitação"
        badge={{ label: 'Alimentação', color: '#FAEEDA', textColor: '#854F0B' }}
      />

      {/* ── Sono ── */}
      <TimelineItem
        icone="🌙"
        iconeBg="#EEEDFE"
        horario="13:00"
        titulo="Soninho"
        descricao="Dormiu bem"
        badge={{ label: 'Sono', color: '#EEEDFE', textColor: '#534AB7' }}
      />

      {/* ── Higiene ── */}
      <TimelineItem
        icone="🛁"
        iconeBg="#E1F5EE"
        horario="14:00"
        titulo="Higiene"
        descricao="Banho · Escovação"
        badge={{ label: 'Higiene', color: '#E1F5EE', textColor: '#0F6E56' }}
      />

      {/* ── Saída com expandível ── */}
      <TimelineItem
        icone="🏠"
        iconeBg="#FAF7F2"
        horario="17:24"
        titulo="Saída"
        descricao="Sofia saiu com seu pai"
        expandivel
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, color: '#3A2E24' }}>João Silva — pai</p>
          <p style={{ margin: 0, fontSize: 11, color: '#8C7060' }}>Registrado pela Profa. Ana</p>
        </div>
      </TimelineItem>

    </div>
  )
}