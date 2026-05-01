/**
 * Card — container elevado para agrupar conteúdo relacionado.
 * Base para a maioria dos blocos visuais do app.
 *
 * Radius 20px · sombra warm · fundo surface.
 * Aceita qualquer conteúdo via children.
 */

type CardProps = {
  children: React.ReactNode
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg'
  className?: string
}

const paddings = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export function Card({
  children,
  onClick,
  padding = 'md',
  className = '',
}: CardProps) {
  return (
    <div
      className={`
        rounded-[20px] bg-[#FFFDF9]
        shadow-[0_2px_8px_rgba(180,140,120,0.12)]
        ${paddings[padding]}
        ${onClick
          ? 'cursor-pointer active:scale-[0.97] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(180,140,120,0.16)]'
          : ''
        }
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}