/**
 * Input — exemplos de uso
 *
 * Este arquivo documenta todos os casos de uso do componente Input.
 * Não é importado em nenhuma página — serve como referência para
 * quem for usar ou manter o componente.
 *
 * Para visualizar, cole temporariamente em qualquer page.tsx.
 */

import { Input } from './Input'

export function InputExamples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
      {/* ── Estado padrão ── */}
      <Input label="Nome da criança" placeholder="Lara Mendes" />

      {/* ── Com valor preenchido ── */}
      <Input
        label="Email"
        type="email"
        placeholder="seu@email.com"
        defaultValue="maria@gmail.com"
      />

      {/* ── Senha ── */}
      <Input label="Senha" type="password" placeholder="••••••••" />

      {/* ── Estado de erro ── */}
      <Input
        label="Email"
        type="email"
        placeholder="seu@email.com"
        defaultValue="maria@gmail"
        error="Email inválido. Verifique e tente novamente."
      />

      {/* ── Desabilitado ── */}
      <Input label="Matrícula" placeholder="Gerado automaticamente" disabled />

      {/* ── Textarea — observações ── */}
      <Input label="Observação" placeholder="Dormiu bem e comeu tudinho ☀️" />
    </div>
  )
}
