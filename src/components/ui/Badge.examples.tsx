/**
 * Badge — exemplos de uso
 *
 * Este arquivo documenta todos os casos de uso do componente Badge.
 * Não é importado em nenhuma página — serve como referência para
 * quem for usar ou manter o componente.
 */

import { Badge } from './Badge'

export function BadgeExamples() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 24 }}>

      {/* ── Status de presença ── */}
      <Badge label="Presente" color="#EAF3DE" textColor="#3B6D11" />
      <Badge label="Ausente" color="#FCF0EB" textColor="#A32D2D" />

      {/* ── Status de ocorrência ── */}
      <Badge label="Pendente" color="#FCEBEB" textColor="#A32D2D" />
      <Badge label="Enviado" color="#EAF3DE" textColor="#3B6D11" />
      <Badge label="Rascunho" color="#F5F5F0" textColor="#8C7060" />

      {/* ── Categorias de rotina ── */}
      <Badge label="Alimentação" color="#FAEEDA" textColor="#854F0B" />
      <Badge label="Sono" color="#EEEDFE" textColor="#534AB7" />
      <Badge label="Higiene" color="#E1F5EE" textColor="#0F6E56" />
      <Badge label="Presença" color="#EAF3DE" textColor="#3B6D11" />

      {/* ── Com dot ── */}
      <Badge label="Nova" color="#FAEEDA" textColor="#854F0B" dot />
      <Badge label="Atenção" color="#FCEBEB" textColor="#A32D2D" dot />

      {/* ── Humor ── */}
      <Badge label="Contente" color="#EAF3DE" textColor="#3B6D11" />
      <Badge label="Tranquilo" color="#EEEDFE" textColor="#534AB7" />
      <Badge label="Agitado" color="#FAEEDA" textColor="#854F0B" />
      <Badge label="Choroso" color="#FCEBEB" textColor="#A32D2D" />

    </div>
  )
}