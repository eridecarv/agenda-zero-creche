/**
 * AlertItem — item expandível de atenção no dashboard da adm.
 * Usado para: ocorrências pendentes, justificativas, novos responsáveis.
 *
 * Tem um indicador colorido de prioridade e expande ao tocar
 * para revelar os detalhes sem sair da tela.
 */

import { useState } from 'react'

type AlertItemProps = {
  title: string
  subtitle: string
  color?: string
  children?: React.ReactNode
}

export function AlertItem({
  title,
  subtitle,
  color = '#E86C88',
  children,
}: AlertItemProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-[14px] bg-[#FFFDF9] shadow-[0_2px_8px_rgba(180,140,120,0.12)] overflow-hidden">

      {/* Cabeçalho clicável */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <span
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#3A2E24]">{title}</p>
          <p className="text-xs text-[#8C7060]">{subtitle}</p>
        </div>
        <span
          className="text-xs text-[#8C7060] transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>

      {/* Conteúdo expandido */}
      {open && children && (
        <div className="px-4 pb-3 border-t border-[#F0EAE4]">
          {children}
        </div>
      )}

    </div>
  )
}