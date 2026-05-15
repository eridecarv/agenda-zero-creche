/**
 * Avatar — exemplos de uso
 *
 * Este arquivo documenta todos os casos de uso do componente Avatar.
 * Não é importado em nenhuma página — serve como referência para
 * quem for usar ou manter o componente.
 */

import { Avatar } from './Avatar'

export function AvatarExamples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>

      {/* ── Tamanhos ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar name="Lara" size="sm" />
        <Avatar name="Lara" size="md" />
        <Avatar name="Lara" size="lg" />
      </div>

      {/* ── Emojis diferentes por idade/contexto ── */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar name="Bebê" emoji="👶" />
        <Avatar name="Criança" emoji="🧒" />
        <Avatar name="Menina" emoji="👧" />
        <Avatar name="Menino" emoji="👦" />
      </div>

      {/* ── Com foto real ── */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar
          name="Sofia"
          photo="https://i.pravatar.cc/150?img=47"
          size="lg"
        />
      </div>

      {/* ── Uso típico: junto com nome ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name="Lara Mendes" emoji="👧" size="md" />
        <div>
          <p style={{ margin: 0, fontWeight: 500 }}>Lara Mendes</p>
          <p style={{ margin: 0, fontSize: 12, color: '#8C7060' }}>1 ano e 2 meses</p>
        </div>
      </div>

    </div>
  )
}