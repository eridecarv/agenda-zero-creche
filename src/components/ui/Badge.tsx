/**
 * Badge — etiqueta de status ou categoria.
 * Usado para: Presente, Pendente, Nova, Validada, etc.
 *
 * A cor é sempre passada via prop para manter flexibilidade
 * com o design system — cada contexto tem sua cor semântica.
 */

type BadgeProps = {
  label: string
  color?: string // cor de fundo
  textColor?: string // cor do texto
  dot?: boolean // mostra um ponto colorido antes do label
}

export function Badge({
  label,
  color = '#EAF3DE',
  textColor = '#3A2E24',
  dot = false,
}: BadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
      style={{ backgroundColor: color, color: textColor }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: textColor }} />}
      {label}
    </span>
  )
}
