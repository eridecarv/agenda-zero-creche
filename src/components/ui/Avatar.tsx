/**
 * Avatar — representação visual de uma criança ou usuário.
 * Círculo com gradiente peach e emoji como placeholder.
 * Quando houver foto real, exibe a imagem.
 */

type AvatarProps = {
  nome: string        // usado para acessibilidade e inicial
  foto?: string       // URL da foto real (opcional)
  emoji?: string      // emoji placeholder (opcional)
  tamanho?: 'sm' | 'md' | 'lg'
}

const tamanhos = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-xl',
  lg: 'w-16 h-16 text-3xl',
}

export function Avatar({
  nome,
  foto,
  emoji = '👶',
  tamanho = 'md',
}: AvatarProps) {
  return (
    <div
      className={`
        ${tamanhos[tamanho]}
        rounded-full flex items-center justify-center
        flex-shrink-0 overflow-hidden
      `}
      style={{
        background: foto
          ? undefined
          : 'linear-gradient(135deg, #FFD4C2 0%, #FFBCA0 100%)',
        boxShadow: '0 2px 8px rgba(180, 140, 120, 0.2)',
      }}
      aria-label={nome}
    >
      {foto ? (
        <img
          src={foto}
          alt={nome}
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