/**
 * TimelineItem — item da rotina diária no feed do responsável.
 * Exibe ícone colorido + horário + título + descrição + badge de categoria.
 *
 * Pode ter conteúdo expandível para detalhes adicionais.
 */

import { useState } from 'react'
import { Badge } from './Badge'

type TimelineItemProps = {
  icone: string
  iconeBg: string         // cor de fundo do ícone
  horario: string
  titulo: string
  descricao?: string
  badge?: {
    label: string
    color: string
    textColor: string
  }
  expandivel?: boolean
  children?: React.ReactNode
}

export function TimelineItem({
  icone,
  iconeBg,
  horario,
  titulo,
  descricao,
  badge,
  expandivel = false,
  children,
}: TimelineItemProps) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="rounded-[20px] bg-[#FFFDF9] shadow-[0_2px_8px_rgba(180,140,120,0.12)] p-4">

      {/* Cabeçalho */}
      <div className="flex items-start gap-3">

        {/* Ícone */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: iconeBg }}
        >
          {icone}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-[#8C7060]">{horario}</p>
              <p className="text-sm font-semibold text-[#3A2E24]">{titulo}</p>
            </div>
            {badge && (
              <Badge
                label={badge.label}
                color={badge.color}
                textColor={badge.textColor}
              />
            )}
          </div>

          {descricao && (
            <p className="mt-1 text-sm text-[#8C7060] leading-relaxed">
              {descricao}
            </p>
          )}
        </div>
      </div>

      {/* Conteúdo expandível */}
      {expandivel && children && (
        <>
          <div className="mt-3 pt-3 border-t border-[#F0EAE4]">
            {aberto ? (
              children
            ) : (
              <button
                className="text-xs text-[#8C7060] underline decoration-dotted"
                onClick={() => setAberto(true)}
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