/**
 * Atomic button component.
 * Follows the Agenda Zero design system.
 *
 * Predefined variants cover the most common cases.
 * For contexts with a different background, use the
 * customColor and customTextColor props to keep radius,
 * typography, and transitions consistent.
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'pill'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
  variant?: ButtonVariant
  fullWidth?: boolean
  customColor?: string // custom background color
  customTextColor?: string // custom text color
  customBorderColor?: string // custom border color (for ghost)
}

export function Button({
  loading = false,
  variant = 'primary',
  fullWidth = true,
  customColor,
  customTextColor,
  customBorderColor,
  children,
  style,
  ...props
}: ButtonProps) {
  // ── Fixed styles — never change regardless of variant ──
  const base = `
    px-4 py-3
    text-[length:var(--text-label)] font-semibold
    [transition:var(--transition-fast)]
    disabled:cursor-not-allowed disabled:opacity-50
    active:scale-[0.97]
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2
    focus-visible:ring-offset-[var(--color-bg)]
    ${fullWidth ? 'w-full' : 'w-auto'}
  `

  // ── Predefined variants — colors and shadows via tokens, never hex ──
  const variants: Record<ButtonVariant, string> = {
    primary: `
      bg-[var(--color-primary)] text-white
      rounded-[var(--radius-md)]
      hover:brightness-105
      shadow-[var(--shadow-sm)]
    `,
    secondary: `
      bg-[var(--color-success-soft)] text-[var(--color-success-strong)]
      rounded-[var(--radius-md)]
      hover:brightness-105
      shadow-[var(--shadow-sm)]
    `,
    ghost: `
      bg-transparent text-[var(--color-fg2)]
      rounded-[var(--radius-md)]
      hover:bg-[var(--color-bg)]
    `,
    pill: `
      bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]
      rounded-[var(--radius-pill)]
      hover:brightness-105
      shadow-[var(--shadow-sm)]
    `,
  }

  // ── Custom styles via prop (override the variant) ──
  const customStyle = {
    ...(customColor && { backgroundColor: customColor }),
    ...(customTextColor && { color: customTextColor }),
    ...(customBorderColor && {
      borderColor: customBorderColor,
      borderWidth: '1px',
      borderStyle: 'solid',
    }),
    ...style,
  }

  // ── Fixed radius per variant (never changes), via token even in custom mode ──
  const radius = variant === 'pill' ? 'rounded-[var(--radius-pill)]' : 'rounded-[var(--radius-md)]'

  return (
    <button
      className={`
        ${base}
        ${customColor ? radius : variants[variant]}
      `}
      style={customStyle}
      disabled={loading || props.disabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? 'Aguarde...' : children}
    </button>
  )
}
