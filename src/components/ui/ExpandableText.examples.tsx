/**
 * ExpandableText — exemplos de uso
 *
 * Este arquivo documenta todos os casos de uso do componente ExpandableText.
 * Não é importado em nenhuma página — serve como referência para
 * quem for usar ou manter o componente.
 */

import { ExpandableText } from './ExpandableText'

export function ExpandableTextExamples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      {/* ── Uso típico — dentro de um parágrafo narrativo ── */}
      <p style={{ fontSize: 15, color: '#8C7060', lineHeight: 1.7 }}>
        Sofia comeu bem, repetiu na hora do almoço. Fez coco, tomou banho. De tarde ficou meio
        amoada —{' '}
        <ExpandableText
          text="dormiu pouco"
          detail="Cochilou menos de meia hora de manhã e um pouquinho depois do almoço, mas ficou inquieta."
          author="Profa. Ana · 14:05"
        />
        .
      </p>

      {/* ── Sem autor ── */}
      <p style={{ fontSize: 15, color: '#8C7060', lineHeight: 1.7 }}>
        Lara{' '}
        <ExpandableText text="comeu bem" detail="Aceitou o almoço todo e ainda pediu mais fruta." />{' '}
        e dormiu tranquilamente.
      </p>

      {/* ── Múltiplos expandíveis no mesmo parágrafo ── */}
      <p style={{ fontSize: 15, color: '#8C7060', lineHeight: 1.7 }}>
        Theo{' '}
        <ExpandableText
          text="ficou agitado"
          detail="Chorou bastante no início da manhã, mas melhorou depois do almoço."
          author="Profa. Bia · 09:20"
        />{' '}
        mas{' '}
        <ExpandableText
          text="comeu bem"
          detail="Aceitou todas as refeições sem resistência."
          author="Profa. Bia · 13:00"
        />
        .
      </p>
    </div>
  )
}
