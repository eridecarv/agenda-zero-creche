/**
 * BottomNav — exemplos de uso
 *
 * Este arquivo documenta todos os casos de uso do componente BottomNav.
 * Não é importado em nenhuma página — serve como referência para
 * quem for usar ou manter o componente.
 */

import { BottomNav } from './BottomNav'

export function BottomNavExamples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48, padding: 24 }}>

      {/* ── Nav do responsável ── */}
      <div style={{ position: 'relative', height: 60 }}>
        <BottomNav
          itens={[
            { label: 'Início', icon: '🏠', href: '/', ativo: true },
            { label: 'Diário', icon: '📖', href: '/diario' },
            { label: 'Avisos', icon: '💬', href: '/avisos' },
            { label: 'Perfil', icon: '👤', href: '/perfil' },
          ]}
        />
      </div>

      {/* ── Nav da adm ── */}
      <div style={{ position: 'relative', height: 60 }}>
        <BottomNav
          itens={[
            { label: 'Início', icon: '🏠', href: '/adm', ativo: true },
            { label: 'Turmas', icon: '👥', href: '/adm/turmas' },
            { label: 'Avisos', icon: '📢', href: '/adm/avisos' },
            { label: 'Config.', icon: '⚙️', href: '/adm/config' },
          ]}
        />
      </div>

    </div>
  )
}