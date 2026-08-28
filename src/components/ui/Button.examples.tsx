/**
 * Button — exemplos de uso
 *
 * Este arquivo documenta todos os casos de uso do componente Button.
 * Não é importado em nenhuma página — serve como referência para
 * quem for usar ou manter o componente.
 *
 * Para visualizar, cole temporariamente em qualquer page.tsx.
 */

import { Button } from './Button'

export function ButtonExamples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
      {/* ── Variantes pré-definidas ── */}
      <Button variant="primary">Registrar</Button>
      <Button variant="secondary">Adicionar</Button>
      <Button variant="ghost">Cancelar</Button>
      <Button variant="pill" fullWidth={false}>
        + Foto
      </Button>

      {/* ── Estado de carregamento ── */}
      <Button variant="primary" loading={true}>
        Registrar
      </Button>

      {/* ── Estado desabilitado ── */}
      <Button variant="primary" disabled>
        Salvar
      </Button>

      {/* ── Tamanho automático ── */}
      <Button variant="primary" fullWidth={false}>
        Ação
      </Button>

      {/* ── Cores customizadas (mantém radius e tipografia) ── */}
      <Button customColor="#9E78D8" customTextColor="white">
        Ver saúde
      </Button>

      <Button customColor="#5A8ED6" customTextColor="white">
        Informativo
      </Button>

      {/* ── Ghost customizado para diferentes fundos ── */}
      <Button variant="ghost" customTextColor="#FF8C66">
        Cancelar (peach)
      </Button>

      {/* ── Pill customizado ── */}
      <Button variant="pill" fullWidth={false} customColor="#72AA78">
        + Adicionar
      </Button>
    </div>
  )
}
