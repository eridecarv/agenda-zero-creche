/**
 * Componente atômico de input.
 * Segue o design system do Agenda Zero.
 * Suporta estados: default, foco, erro.
 */

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {/* Label */}
      <label className="text-sm font-medium text-[#3A2E24]">{label}</label>

      {/* Campo */}
      <input
        className={`
          w-full rounded-[14px] border px-4 py-3 text-sm
          bg-[#FFFDF9] text-[#3A2E24]
          placeholder:text-[#C4B5A8]
          outline-none transition-all duration-200
          focus:border-[#FF8C66] focus:ring-2 focus:ring-[#FF8C66]/20
          ${
            error
              ? 'border-[#E86C88] bg-[#FFF5F7] focus:border-[#E86C88] focus:ring-[#E86C88]/20'
              : 'border-[#E8E0D8]'
          }
        `}
        {...props}
      />

      {/* Mensagem de erro */}
      {error && <span className="text-xs text-[#E86C88]">{error}</span>}
    </div>
  )
}
