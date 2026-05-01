/**
 * NarrativeCard — card do resumo narrativo do dia.
 * É a primeira coisa que o responsável vê ao abrir o app.
 *
 * Exibe o texto gerado automaticamente por template,
 * com trechos clicáveis que expandem detalhes (ExpandableText).
 * Mostra também as três métricas rápidas do dia.
 */

import { Badge } from './Badge'

type Metrica = {
  label: string
  valor: string
}

type NarrativeCardProps = {
  texto: React.ReactNode   // aceita ExpandableText dentro do texto
  humor?: string
  metricas: Metrica[]
  atualizadoEm?: string
  diaConcluido?: boolean
  onVerAgendaCompleta?: () => void
}

const humores: Record<string, { label: string; color: string; textColor: string }> = {
  contente:  { label: 'Contente',  color: '#EAF3DE', textColor: '#3B6D11' },
  tranquilo: { label: 'Tranquilo', color: '#EEEDFE', textColor: '#534AB7' },
  agitado:   { label: 'Agitado',   color: '#FAEEDA', textColor: '#854F0B' },
  choroso:   { label: 'Choroso',   color: '#FCEBEB', textColor: '#A32D2D' },
}

export function NarrativeCard({
  texto,
  humor,
  metricas,
  atualizadoEm,
  diaConcluido = false,
  onVerAgendaCompleta,
}: NarrativeCardProps) {
  const humorInfo = humor ? humores[humor] : null

  return (
    <div className="rounded-[20px] bg-[#FFFDF9] shadow-[0_2px_8px_rgba(180,140,120,0.12)] p-4">

      {/* Resumo narrativo + humor */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm text-[#8C7060] leading-relaxed flex-1">
          {texto}
        </p>
        {humorInfo && (
          <div className="flex-shrink-0">
            <p className="text-[9px] font-medium text-[#8C7060] uppercase tracking-wide mb-1">
              HUMOR
            </p>
            <Badge
              label={humorInfo.label}
              color={humorInfo.color}
              textColor={humorInfo.textColor}
            />
          </div>
        )}
      </div>

      {/* Aviso de dia em andamento */}
      {!diaConcluido && (
        <div className="mb-3 rounded-[10px] bg-[#FAF7F2] px-3 py-2 border-l-2 border-[#E8E0D8]">
          <p className="text-xs text-[#8C7060] leading-relaxed">
            O dia ainda está acontecendo. Mais novidades aparecerão aqui no decorrer do dia.
          </p>
        </div>
      )}

      {/* Métricas rápidas */}
      <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: `repeat(${metricas.length}, 1fr)` }}>
        {metricas.map((m) => (
          <div key={m.label}>
            <p className="text-[9px] font-medium text-[#8C7060] uppercase tracking-wide">
              {m.label}
            </p>
            <p className="text-base font-bold text-[#3A2E24]" style={{ fontFamily: 'var(--font-display)' }}>
              {m.valor}
            </p>
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div className="flex items-center justify-between pt-3 border-t border-[#F0EAE4]">
        {atualizadoEm && (
          <p className="text-xs text-[#C4B5A8]">Atualizado às {atualizadoEm}</p>
        )}
        {onVerAgendaCompleta && (
          <button
            className="text-xs font-medium text-[#FF8C66]"
            onClick={onVerAgendaCompleta}
          >
            Ver agenda completa →
          </button>
        )}
      </div>

    </div>
  )
}