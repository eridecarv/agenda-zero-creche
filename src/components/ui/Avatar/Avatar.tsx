/**
 * Avatar — visual representation of a child or user.
 * Circle with peach gradient and emoji as placeholder.
 * When a real photo is available, displays the image instead.
 */

type AvatarProps = {
  name: string // used for accessibility and initials
  photo?: string // real photo URL (optional)
  emoji?: string // placeholder emoji (optional)
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-xl',
  lg: 'w-16 h-16 text-3xl',
}

export function Avatar({ name, photo, emoji = '👶', size = 'md' }: AvatarProps) {
  return (
    <div
      className={`
        ${sizes[size]}
        rounded-full flex items-center justify-center
        shrink-0 overflow-hidden shadow-sm
        ${!photo ? 'bg-linear-to-br from-primary-soft to-primary' : ''}
      `}
      aria-label={name}
    >
      {photo ? (
        <img src={photo} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span role="img" aria-hidden="true">
          {emoji}
        </span>
      )}
    </div>
  )
}
