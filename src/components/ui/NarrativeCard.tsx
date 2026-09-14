/**
 * NarrativeCard — daily narrative summary card.
 * The first thing the guardian sees when opening the app.
 *
 * Displays the auto-generated template text, with clickable
 * excerpts that expand details (ExpandableText). Also shows
 * the day's three quick metrics.
 */

import { Badge } from './Badge'

type Metric = {
  label: string
  value: string
}

type MoodVariant = 'primary' | 'success' | 'warning' | 'danger'

type NarrativeCardProps = {
  text: React.ReactNode // accepts ExpandableText inside the text
  mood?: string
  metrics: Metric[]
  updatedAt?: string
  dayComplete?: boolean
  onViewFullSchedule?: () => void
}

// TODO: "tranquilo" mapped to "primary" for lack of a soft/strong pair
// for --color-health (Lavender) — no mood badge has a real consumer
// yet. Revisit with a value sourced from Figma once the daily summary
// feature is actually built in Phase 2, instead of approximating here.
const moods: Record<string, { label: string; variant: MoodVariant }> = {
  contente: { label: 'Contente', variant: 'success' },
  tranquilo: { label: 'Tranquilo', variant: 'primary' },
  agitado: { label: 'Agitado', variant: 'warning' },
  choroso: { label: 'Choroso', variant: 'danger' },
}

export function NarrativeCard({
  text,
  mood,
  metrics,
  updatedAt,
  dayComplete = false,
  onViewFullSchedule,
}: NarrativeCardProps) {
  const moodInfo = mood ? moods[mood] : null

  return (
    <div className="rounded-lg bg-surface shadow-sm p-4">
      {/* Narrative summary + mood */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm text-fg2 leading-relaxed flex-1">{text}</p>
        {moodInfo && (
          <div className="shrink-0">
            <p className="text-[9px] font-medium text-fg2 uppercase tracking-wide mb-1">HUMOR</p>
            <Badge label={moodInfo.label} variant={moodInfo.variant} />
          </div>
        )}
      </div>

      {/* In-progress day notice */}
      {!dayComplete && (
        <div className="mb-3 rounded-sm bg-bg px-3 py-2 border-l-2 border-border-default">
          <p className="text-xs text-fg2 leading-relaxed">
            O dia ainda está acontecendo. Mais novidades aparecerão aqui no decorrer do dia.
          </p>
        </div>
      )}

      {/* Quick metrics */}
      <div
        className="grid gap-2 mb-3"
        style={{ gridTemplateColumns: `repeat(${metrics.length}, 1fr)` }}
      >
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="text-[9px] font-medium text-fg2 uppercase tracking-wide">{m.label}</p>
            <p
              className="text-base font-bold text-fg1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#F0EAE4]">
        {updatedAt && <p className="text-xs text-[#C4B5A8]">Atualizado às {updatedAt}</p>}
        {onViewFullSchedule && (
          <button className="text-xs font-medium text-primary" onClick={onViewFullSchedule}>
            Ver agenda completa →
          </button>
        )}
      </div>
    </div>
  )
}
