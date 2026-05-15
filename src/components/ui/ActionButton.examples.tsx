/**
 * ActionButton — exemplos de uso
 *
 * Este arquivo documenta todos os casos de uso do componente ActionButton.
 * Não é importado em nenhuma página — serve como referência para
 * quem for usar ou manter o componente.
 */

import { ActionButton } from './ActionButton'

export function ActionButtonExamples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>

      {/* ── Grade 2x2 — uso típico no dashboard ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <ActionButton
          icon="📢"
          title="Comunicado"
          subtitle="Criar novo"
          onClick={() => alert('Criar comunicado')}
        />
        <ActionButton
          icon="👶"
          title="Cadastros"
          subtitle="Crianças · Turmas · Docentes"
          onClick={() => alert('Ir para cadastros')}
        />
        <ActionButton
          icon="🍽"
          title="Cardápio"
          subtitle="Semana atual"
          onClick={() => alert('Ver cardápio')}
        />
        <ActionButton
          icon="📋"
          title="Ocorrências"
          subtitle="Ver todas"
          onClick={() => alert('Ver ocorrências')}
        />
      </div>

      {/* ── Sem subtítulo ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <ActionButton icon="📢" title="Comunicado" />
        <ActionButton icon="👶" title="Cadastros" />
      </div>

    </div>
  )
}