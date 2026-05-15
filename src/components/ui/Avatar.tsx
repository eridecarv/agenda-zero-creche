/**
 * Avatar — representação visual de uma criança ou usuário.
 * Círculo com gradiente peach e emoji como placeholder.
 * Quando houver foto real, exibe a imagem.
 */

type AvatarProps = {
  name: string        // usado para acessibilidade e inicial
  photo?: string      // URL da foto real (opcional)
  emoji?: string      // emoji placeholder (opcional)
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-xl',
  lg: 'w-16 h-16 text-3xl',
}

export function Avatar({
  name,
  photo,
  emoji = '👶',
  size = 'md',
}: AvatarProps) {
  return (
    <div
      className={`
        ${sizes[size]}
        rounded-full flex items-center justify-center
        flex-shrink-0 overflow-hidden
      `}
      style={{
        background: photo
          ? undefined
          : 'linear-gradient(135deg, #FFD4C2 0%, #FFBCA0 100%)',
        boxShadow: '0 2px 8px rgba(180, 140, 120, 0.2)',
      }}
      aria-label={name}
    >
      {photo ? (
        <img
          src={photo}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span role="img" aria-hidden="true">
          {emoji}
        </span>
      )}
    </div>
  )
}