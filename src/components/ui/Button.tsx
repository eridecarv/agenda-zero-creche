/**
 * Componente atômico de botão.
 * Segue o design system do Agenda Zero.
 *
 * Variantes pré-definidas para os casos mais comuns.
 * Para contextos com fundo diferente, use as props
 * customColor e customTextColor para manter a consistência
 * do radius, tipografia e transições.
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'pill'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
  variant?: ButtonVariant
  fullWidth?: boolean
  customColor?: string // cor de fundo customizada
  customTextColor?: string // cor de texto customizada
  customBorderColor?: string // cor de borda customizada (para ghost)
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
  // ── Estilos fixos — nunca mudam independente da variante ──
  const base = `
    px-4 py-3 text-sm font-medium
    transition-all duration-200 ease-out
    disabled:cursor-not-allowed disabled:opacity-50
    active:scale-[0.97]
    ${fullWidth ? 'w-full' : 'w-auto'}
  `

  // ── Variantes pré-definidas ──
  const variants: Record<ButtonVariant, string> = {
    primary: `
      bg-[#FF8C66] text-white rounded-[14px]
      hover:brightness-105
      shadow-[0_2px_8px_rgba(180,140,120,0.2)]
    `,
    secondary: `
      bg-[#72AA78] text-white rounded-[14px]
      hover:brightness-105
      shadow-[0_2px_8px_rgba(180,140,120,0.16)]
    `,
    ghost: `
      bg-transparent text-[#8C7060] rounded-[14px]
      hover:bg-[#FAF7F2]
    `,
    pill: `
      bg-[#FF8C66] text-white rounded-full
      hover:brightness-105
      shadow-[0_2px_8px_rgba(180,140,120,0.2)]
    `,
  }

  // ── Estilos customizados via prop (sobrescrevem a variante) ──
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

  // ── Radius fixo por variante (nunca muda) ──
  const radius = variant === 'pill' ? 'rounded-full' : 'rounded-[14px]'

  return (
    <button
      className={`
        ${base}
        ${customColor ? radius : variants[variant]}
      `}
      style={customStyle}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Aguarde...' : children}
    </button>
  )
}
