/**
 * TimelineItem — item da rotina diária no feed do responsável.
 * Exibe ícone colorido + horário + título + descrição + badge de categoria.
 *
 * Pode ter conteúdo expandível para detalhes adicionais.
 */

import { useState } from 'react'
import { Badge } from './Badge'

type TimelineItemProps = {
  icon: string
  iconBg: string // cor de fundo do ícone
  time: string
  title: string
  description?: string
  badge?: {
    label: string
    color: string
    textColor: string
  }
  expandable?: boolean
  children?: React.ReactNode
}

export function TimelineItem({
  icon,
  iconBg,
  time,
  title,
  description,
  badge,
  expandable = false,
  children,
}: TimelineItemProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-[20px] bg-[#FFFDF9] shadow-[0_2px_8px_rgba(180,140,120,0.12)] p-4">
      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-[#8C7060]">{time}</p>
              <p className="text-sm font-semibold text-[#3A2E24]">{title}</p>
            </div>
            {badge && <Badge label={badge.label} color={badge.color} textColor={badge.textColor} />}
          </div>

          {description && (
            <p className="mt-1 text-sm text-[#8C7060] leading-relaxed">{description}</p>
          )}
        </div>
      </div>

      {/* Conteúdo expandível */}
      {expandable && children && (
        <>
          <div className="mt-3 pt-3 border-t border-[#F0EAE4]">
            {open ? (
              children
            ) : (
              <button
                className="text-xs text-[#8C7060] underline decoration-dotted"
                onClick={() => setOpen(true)}
              >
                ver detalhes →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
