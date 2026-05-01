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
          icone="📢"
          titulo="Comunicado"
          subtitulo="Criar novo"
          onClick={() => alert('Criar comunicado')}
        />
        <ActionButton
          icone="👶"
          titulo="Cadastros"
          subtitulo="Crianças · Turmas · Docentes"
          onClick={() => alert('Ir para cadastros')}
        />
        <ActionButton
          icone="🍽"
          titulo="Cardápio"
          subtitulo="Semana atual"
          onClick={() => alert('Ver cardápio')}
        />
        <ActionButton
          icone="📋"
          titulo="Ocorrências"
          subtitulo="Ver todas"
          onClick={() => alert('Ver ocorrências')}
        />
      </div>

      {/* ── Sem subtítulo ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <ActionButton icone="📢" titulo="Comunicado" />
        <ActionButton icone="👶" titulo="Cadastros" />
      </div>

    </div>
  )
}