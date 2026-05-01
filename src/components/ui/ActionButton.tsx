/**
 * ActionButton — botão de ação rápida no dashboard da adm.
 * Exibe ícone + título + subtítulo em um card clicável.
 * Usado na grade 2x2 de ações rápidas.
 */

type ActionButtonProps = {
  icone: string
  titulo: string
  subtitulo?: string
  onClick?: () => void
}

export function ActionButton({
  icone,
  titulo,
  subtitulo,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      className="flex flex-col items-start gap-1 rounded-[14px] bg-[#FFFDF9] p-4 text-left shadow-[0_2px_8px_rgba(180,140,120,0.12)] transition-all duration-200 active:scale-[0.97] hover:shadow-[0_4px_16px_rgba(180,140,120,0.16)] w-full"
      onClick={onClick}
    >
      <span className="text-2xl leading-none">{icone}</span>
      <p className="mt-1 text-sm font-semibold text-[#3A2E24]">{titulo}</p>
      {subtitulo && (
        <p className="text-xs text-[#8C7060]">{subtitulo}</p>
      )}
    </button>
  )
}