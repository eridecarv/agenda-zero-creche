/**
 * Card — elevated container to group related content.
 * Base for most visual blocks across the app.
 *
 * Radius 20px · warm shadow · surface background.
 * Accepts any content via children.
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

export function Card({ children, onClick, padding = 'md', className = '' }: CardProps) {
  return (
    <div
      className={`
        rounded-lg bg-surface shadow-sm
        ${paddings[padding]}
        ${
          onClick
            ? 'cursor-pointer active:scale-[0.97] [transition:var(--transition-fast)] hover:shadow-md'
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
