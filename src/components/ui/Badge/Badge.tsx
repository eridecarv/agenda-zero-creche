/**
 * Badge — status or category label.
 * Used for: class name, level, presence, invite status, etc.
 *
 * Maps to one of the guide's four semantic variants — no free-form
 * hex color is accepted, to keep every badge visually consistent
 * with the rest of the design system.
 */

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger'

type BadgeProps = {
  label: string
  variant?: BadgeVariant
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary-soft text-primary-strong',
  success: 'bg-success-soft text-success-strong',
  warning: 'bg-warning-soft text-warning-strong',
  danger: 'bg-danger-soft text-danger-strong',
}

export function Badge({ label, variant = 'primary', dot = false }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-pill px-3 py-1
        text-caption font-medium
        ${variantClasses[variant]}
      `}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label}
    </span>
  )
}
