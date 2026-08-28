/**
 * MetricCard — card pequeno com número em destaque.
 * Usado no dashboard da adm para exibir métricas do dia:
 * presentes, ausentes, turmas, ocorrências pendentes, etc.
 */

type MetricCardProps = {
  label: string
  value: number | string
  color?: string // cor do valor em destaque
  onClick?: () => void
}

export function MetricCard({ label, value, color = '#3A2E24', onClick }: MetricCardProps) {
  return (
    <div
      className={`
        flex flex-col gap-1 rounded-[14px] bg-[#FFFDF9] p-3
        shadow-[0_2px_8px_rgba(180,140,120,0.12)]
        ${onClick ? 'cursor-pointer active:scale-[0.97] transition-all duration-200' : ''}
      `}
      onClick={onClick}
    >
      {/* Label */}
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#8C7060]">{label}</p>

      {/* Valor em destaque */}
      <p className="text-2xl font-bold" style={{ color, fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
    </div>
  )
}
