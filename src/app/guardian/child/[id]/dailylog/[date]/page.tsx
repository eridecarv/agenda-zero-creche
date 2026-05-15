// src/app/guardian/child/[id]/dailylog/[date]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ExpandableText } from '@/components/ui/ExpandableText'
import { Card } from '@/components/ui/Card'
import type { Mood, Sleep, Meal, Acceptance } from '@/types'

// ── Templates (mesmos da home) ────────────────────────────

const MOOD_TEMPLATES: Record<Mood, string[]> = {
  contente: ['ficou contente o dia todo', 'estava bem-humorada'],
  tranquilo: ['passou o dia tranquila', 'ficou calma e serena'],
  agitado: ['ficou um pouco agitada hoje', 'teve um dia mais agitado'],
  choroso: ['teve um dia mais difícil', 'ficou chorosa durante o dia'],
}

const SLEEP_TEMPLATES: Record<Sleep, string[]> = {
  bom: ['descansou bem no horário', 'dormiu direitinho'],
  regular: ['dormiu um pouco', 'o soninho foi tranquilo'],
  ruim: ['teve dificuldade para dormir', 'dormiu mal hoje'],
  nao_dormiu: ['não conseguiu dormir hoje', 'ficou sem dormir'],
}

const ACCEPTANCE_TEMPLATES: Record<Acceptance, string[]> = {
  boa: ['comeu bem', 'aceitou bem as refeições'],
  regular: ['comeu razoavelmente', 'aceitou parcialmente as refeições'],
  recusou: ['não quis comer muito hoje', 'teve pouco apetite'],
}

const MEAL_LABEL: Record<Meal, string> = {
  cafe: 'Café da manhã',
  lanche_manha: 'Lanche da manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da tarde',
  jantar: 'Jantar',
}

const ACCEPTANCE_STYLE: Record<Acceptance, { bg: string; text: string; label: string }> = {
  boa:     { bg: '#EAF3DE', text: '#4A7A3A', label: 'Comeu bem' },
  regular: { bg: '#FEF6E4', text: '#9A6F2A', label: 'Razoável' },
  recusou: { bg: '#FDE8EC', text: '#A03050', label: 'Recusou' },
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ── Tipos ─────────────────────────────────────────────────

type DayLog = {
  id: string
  mood: Mood | null
  mood_notes: string | null
  sleep: Sleep | null
  sleep_notes: string | null
  present: boolean | null
  check_out: string | null
  picked_up_name: string | null
  feeding: { meal: Meal; acceptance: Acceptance; notes: string | null }[]
  hygiene: { bath: boolean; brushing: boolean; bowel_movement: boolean; notes: string | null } | null
}

// ── Subcomponentes ────────────────────────────────────────

function Chip({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span
      style={{ backgroundColor: bg, color: text }}
      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
    >
      {label}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#C4A882' }} className="text-xs font-medium mb-3">{children}</p>
}

function Divider() {
  return <div style={{ height: '0.5px', backgroundColor: '#C4A882', opacity: 0.25, margin: '10px 0' }} />
}

function PrimaryText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p style={{ color: '#A08060' }} className={`text-sm leading-relaxed ${className}`}>{children}</p>
  )
}

function SecondaryText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p style={{ color: '#C4A882' }} className={`text-xs leading-relaxed ${className}`}>{children}</p>
  )
}

function hygienePhrase(h: DayLog['hygiene']): string {
  if (!h) return ''
  const done: string[] = []
  if (h.bath) done.push('tomou banho')
  if (h.brushing) done.push('escovou os dentinhos')
  if (h.bowel_movement) done.push('fez xixi e cocô')
  if (done.length === 0) return 'Nenhum cuidado registrado.'
  const first = done[0].charAt(0).toUpperCase() + done[0].slice(1)
  if (done.length === 1) return `${first}.`
  const rest = done.slice(1)
  const last = rest.pop()
  return rest.length > 0
    ? `${first}, ${rest.join(', ')} e ${last}.`
    : `${first} e ${last}.`
}

function formatLongDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Componente principal ──────────────────────────────────

export default function DailyLogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const date = params.date as string  // 'YYYY-MM-DD'
  const supabase = createClient()

  const [childName, setChildName] = useState('')
  const [dayLog, setDayLog] = useState<DayLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: child } = await supabase
        .from('children').select('name').eq('id', id).single()
      if (child) setChildName(child.name.split(' ')[0])

      const { data: dl } = await supabase
        .from('daily_logs')
        .select('id, mood, mood_notes, sleep, sleep_notes')
        .eq('child_id', id)
        .eq('date', date)
        .single()

      if (!dl) { setNotFound(true); setLoading(false); return }

      const { data: al } = await supabase
        .from('attendance_logs')
        .select('present, check_out, picked_up_by')
        .eq('daily_log_id', dl.id)
        .single()

      const { data: fls } = await supabase
        .from('feeding_logs')
        .select('meal, acceptance, notes')
        .eq('daily_log_id', dl.id)

      const { data: hl } = await supabase
        .from('hygiene_logs')
        .select('bath, brushing, bowel_movement, notes')
        .eq('daily_log_id', dl.id)
        .single()

      let pickedUpName: string | null = null
      if (al?.picked_up_by) {
        const { data: guardianship } = await supabase
          .from('guardianships')
          .select('nickname, users(name)')
          .eq('child_id', id)
          .eq('user_id', al.picked_up_by)
          .single()
        pickedUpName = guardianship?.nickname ?? (guardianship as any)?.users?.name ?? null
      }

      setDayLog({
        id: dl.id,
        mood: dl.mood,
        mood_notes: dl.mood_notes,
        sleep: dl.sleep,
        sleep_notes: dl.sleep_notes,
        present: al?.present ?? null,
        check_out: al?.check_out ?? null,
        picked_up_name: pickedUpName,
        feeding: fls ?? [],
        hygiene: hl ?? null,
      })

      setLoading(false)
    }
    load()
  }, [id, date])

  function buildNarrative(): React.ReactNode {
    if (!dayLog) return null
    const name = childName
    const parts: React.ReactNode[] = []

    if (dayLog.mood) {
      const template = pickRandom(MOOD_TEMPLATES[dayLog.mood])
      parts.push(
        dayLog.mood_notes
          ? <ExpandableText key="mood" text={template} detail={dayLog.mood_notes} />
          : <span key="mood">{template}</span>
      )
    }

    const lunch = dayLog.feeding.find(f => f.meal === 'almoco')
    const mainMeal = lunch ?? dayLog.feeding[0]
    if (mainMeal) {
      const template = pickRandom(ACCEPTANCE_TEMPLATES[mainMeal.acceptance])
      parts.push(
        mainMeal.notes
          ? <ExpandableText key="feeding" text={template} detail={mainMeal.notes} />
          : <span key="feeding">{template}</span>
      )
    }

    if (dayLog.sleep) {
      const template = pickRandom(SLEEP_TEMPLATES[dayLog.sleep])
      parts.push(
        dayLog.sleep_notes
          ? <ExpandableText key="sleep" text={template} detail={dayLog.sleep_notes} />
          : <span key="sleep">{template}</span>
      )
    }

    if (parts.length === 0) return `${name} teve seu dia registrado.`

    return (
      <>
        {name}{' '}
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < parts.length - 2 ? ', ' : i === parts.length - 2 ? ' e ' : '.'}
          </span>
        ))}
      </>
    )
  }

  function buildChips() {
    if (!dayLog) return []
    const chips: { label: string; bg: string; text: string }[] = []

    if (dayLog.present === false) {
      chips.push({ label: 'Faltou', bg: '#FDE8EC', text: '#A03050' })
    } else if (dayLog.present === true) {
      chips.push({ label: 'Presente', bg: '#EAF3DE', text: '#4A7A3A' })
    }

    if (dayLog.sleep) {
      const sleepLabel: Record<Sleep, string> = {
        bom: 'Dormiu bem', regular: 'Dormiu um pouco',
        ruim: 'Dormiu mal', nao_dormiu: 'Não dormiu',
      }
      const sleepColor: Record<Sleep, { bg: string; text: string }> = {
        bom:        { bg: '#EEF0FE', text: '#4A4AAA' },
        regular:    { bg: '#FEF6E4', text: '#9A6F2A' },
        ruim:       { bg: '#FDE8EC', text: '#A03050' },
        nao_dormiu: { bg: '#F5EFE8', text: '#8C7060' },
      }
      chips.push({ label: sleepLabel[dayLog.sleep], ...sleepColor[dayLog.sleep] })
    }

    if (dayLog.hygiene) {
      const done = [dayLog.hygiene.bath, dayLog.hygiene.brushing, dayLog.hygiene.bowel_movement]
        .filter(Boolean).length
      if (done > 0) chips.push({ label: 'Cuidados feitos', bg: '#FEF0E8', text: '#9A5A2A' })
    }

    return chips
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span style={{ color: '#C4A882' }} className="text-sm">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-8">
      {/* Header com botão voltar */}
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-6 shadow-[0_2px_8px_rgba(180,140,120,0.06)]">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 mb-3"
          style={{ color: '#C4A882' }}
        >
          <span className="text-sm">‹</span>
          <span className="text-xs">Voltar</span>
        </button>
        <p style={{ color: '#C4A882' }} className="text-xs capitalize mb-1">
          {formatLongDate(date)}
        </p>
        <h1 style={{ color: '#A08060' }} className="font-display text-2xl font-bold">
          O dia de {childName}
        </h1>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto flex flex-col gap-4">

        {/* Sem registro */}
        {notFound && (
          <Card padding="lg">
            <div className="flex flex-col items-center text-center py-8 gap-3">
              <div className="w-16 h-16 rounded-full bg-[#F5EFE8] flex items-center justify-center text-3xl">📋</div>
              <p style={{ color: '#A08060' }} className="text-base font-semibold">
                Nenhum registro encontrado
              </p>
              <p style={{ color: '#C4A882' }} className="text-sm leading-relaxed">
                Não há informações registradas para este dia.
              </p>
            </div>
          </Card>
        )}

        {/* Narrativa + chips */}
        {dayLog && (
          <Card padding="lg">
            <PrimaryText className="mb-4">{buildNarrative()}</PrimaryText>

            {/* Saída — sempre encerrado no histórico */}
            {dayLog.check_out && (
              <div
                className="flex items-center gap-2 rounded-[12px] px-3 py-2 mb-4"
                style={{ backgroundColor: '#F5EFE8' }}
              >
                <span className="text-base">👋</span>
                <SecondaryText>
                  Saiu às{' '}
                  {new Date(dayLog.check_out).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Recife',
                  })}
                  {dayLog.picked_up_name ? ` com ${dayLog.picked_up_name}` : ''}
                </SecondaryText>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {buildChips().map((chip, i) => <Chip key={i} {...chip} />)}
            </div>
          </Card>
        )}

        {/* Alimentação */}
        {dayLog && dayLog.feeding.length > 0 && (
          <Card padding="lg">
            <SectionTitle>O que comeu</SectionTitle>
            <div className="flex flex-col">
              {dayLog.feeding.map((f, i) => {
                const style = ACCEPTANCE_STYLE[f.acceptance]
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between py-1">
                      <PrimaryText>{MEAL_LABEL[f.meal]}</PrimaryText>
                      <span
                        style={{ backgroundColor: style.bg, color: style.text }}
                        className="text-xs font-medium px-3 py-1 rounded-full"
                      >
                        {style.label}
                      </span>
                    </div>
                    {f.notes && <SecondaryText className="pb-1">{f.notes}</SecondaryText>}
                    {i < dayLog.feeding.length - 1 && <Divider />}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Higiene */}
        {dayLog?.hygiene && (dayLog.hygiene.bath || dayLog.hygiene.brushing || dayLog.hygiene.bowel_movement) && (
          <Card padding="lg">
            <SectionTitle>Cuidados do dia</SectionTitle>
            <PrimaryText>{hygienePhrase(dayLog.hygiene)}</PrimaryText>
            {dayLog.hygiene.notes && (
              <><Divider /><SecondaryText>{dayLog.hygiene.notes}</SecondaryText></>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}