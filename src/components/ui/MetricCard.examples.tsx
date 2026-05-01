/**
 * MetricCard — exemplos de uso
 *
 * Este arquivo documenta todos os casos de uso do componente MetricCard.
 * Não é importado em nenhuma página — serve como referência para
 * quem for usar ou manter o componente.
 */

import { MetricCard } from './MetricCard'

export function MetricCardExamples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>

      {/* ── Uso típico — grade de 3 colunas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <MetricCard label="Presentes" valor={34} cor="#72AA78" />
        <MetricCard label="Ausentes" valor={6} cor="#E86C88" />
        <MetricCard label="Turmas" valor={5} cor="#3A2E24" />
      </div>

      {/* ── Com ocorrências pendentes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <MetricCard label="Ocorrências" valor={2} cor="#E86C88" />
        <MetricCard label="Comunicados" valor={1} cor="#5A8ED6" />
      </div>

      {/* ── Clicável ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <MetricCard
          label="Presentes"
          valor={34}
          cor="#72AA78"
          onClick={() => alert('Ver lista de presentes')}
        />
        <MetricCard
          label="Ausentes"
          valor={6}
          cor="#E86C88"
          onClick={() => alert('Ver lista de ausentes')}
        />
        <MetricCard
          label="Turmas"
          valor={5}
          cor="#3A2E24"
          onClick={() => alert('Ver turmas')}
        />
      </div>

    </div>
  )
}