/**
 * Card — exemplos de uso
 *
 * Este arquivo documenta todos os casos de uso do componente Card.
 * Não é importado em nenhuma página — serve como referência para
 * quem for usar ou manter o componente.
 */

import { Card } from './Card'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { MetricCard } from './MetricCard'

export function CardExamples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
      {/* ── Card simples com texto ── */}
      <Card>
        <p style={{ margin: 0 }}>Conteúdo simples dentro de um card.</p>
      </Card>

      {/* ── Card com padding pequeno ── */}
      <Card padding="sm">
        <p style={{ margin: 0, fontSize: 12 }}>Card compacto.</p>
      </Card>

      {/* ── Card com padding grande ── */}
      <Card padding="lg">
        <p style={{ margin: 0 }}>Card espaçoso.</p>
      </Card>

      {/* ── Card clicável ── */}
      <Card onClick={() => alert('Card clicado!')}>
        <p style={{ margin: 0 }}>Clique neste card.</p>
      </Card>

      {/* ── Card com componentes internos ── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name="Lara" emoji="👧" />
          <div>
            <p style={{ margin: 0, fontWeight: 500 }}>Lara Mendes</p>
            <p style={{ margin: 0, fontSize: 12, color: '#8C7060' }}>1 ano e 2 meses</p>
          </div>
          <Badge label="Presente" color="#EAF3DE" textColor="#3B6D11" />
        </div>
      </Card>

      {/* ── Card com grade de métricas ── */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <MetricCard label="Presentes" value={34} color="#72AA78" />
          <MetricCard label="Ausentes" value={6} color="#E86C88" />
          <MetricCard label="Turmas" value={5} color="#3A2E24" />
        </div>
      </Card>
    </div>
  )
}
