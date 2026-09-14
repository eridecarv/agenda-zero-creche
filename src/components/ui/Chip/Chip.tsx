/**
 * Chip — small pill-shaped tag for categories, status, or filters.
 * Follows the guide's three usage contexts: category, status, and
 * toggleable filter (active/inactive).
 */

type ChipVariant = 'primary' | 'success' | 'warning' | 'danger'

type ChipProps = {
  label: string
  variant?: ChipVariant
  dot?: boolean
  active?: boolean
  onClick?: () => void
}

const variantClasses: Record<ChipVariant, string> = {
  primary: 'bg-primary-soft text-primary-strong',
  success: 'bg-success-soft text-success-strong',
  warning: 'bg-warning-soft text-warning-strong',
  danger: 'bg-danger-soft text-danger-strong',
}

export function Chip({ label, variant, dot = false, active, onClick }: ChipProps) {
  const isFilter = active !== undefined

  const filterClasses = active ? 'bg-primary text-white' : 'bg-inactive text-fg2'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5
        text-caption font-medium transition-colors
        ${isFilter ? filterClasses : variantClasses[variant ?? 'primary']}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label}
    </button>
  )
}
