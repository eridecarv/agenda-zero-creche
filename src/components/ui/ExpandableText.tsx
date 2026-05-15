/**
 * ExpandableText — trecho de texto clicável que revela detalhe.
 * Usado no NarrativeCard para expandir observações específicas.
 *
 * Exemplo: "dormiu pouco" é clicável e expande o detalhe
 * sem abrir uma nova tela.
 */

import { useState } from 'react'

type ExpandableTextProps = {
  text: string           // trecho clicável no resumo narrativo
  detail: string         // conteúdo revelado ao expandir
  author?: string        // quem registrou (ex: "Profa. Ana · 14:05")
}

export function ExpandableText({
  text,
  detail,
  author,
}: ExpandableTextProps) {
  const [open, setOpen] = useState(false)

  return (
    <span>
      {/* Trecho clicável */}
      <button
        className="font-semibold text-[#3A2E24] underline decoration-dotted underline-offset-2 transition-colors duration-200 hover:text-[#FF8C66]"
        onClick={() => setOpen(!open)}
      >
        {text}{open ? ' ▲' : ''}
      </button>

      {/* Detalhe expandido */}
      {open && (
        <span className="block mt-2 rounded-[10px] bg-[#FAF7F2] px-3 py-2 border-l-2 border-[#E8E0D8]">
          <span className="block text-sm text-[#8C7060] leading-relaxed">
            "{detail}"
          </span>
          {author && (
            <span className="block mt-1 text-xs text-[#C4B5A8]">
              {author}
            </span>
          )}
        </span>
      )}
    </span>
  )
}