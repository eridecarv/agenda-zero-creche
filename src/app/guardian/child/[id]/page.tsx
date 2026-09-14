// src/app/guardian/child/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ExpandableText } from '@/components/ui/ExpandableText'
import { Card } from '@/components/ui/Card'
import type { Mood, Sleep, Meal, Acceptance } from '@/types'

// ── Templates ─────────────────────────────────────────────

const MOOD_TEMPLATES: Record<Mood, string[]> = {
  happy: ['ficou contente o dia todo', 'estava bem-humorada'],
  calm: ['passou o dia tranquila', 'ficou calma e serena'],
  restless: ['ficou um pouco agitada hoje', 'teve um dia mais agitado'],
  tearful: ['teve um dia mais difícil', 'ficou chorosa durante o dia'],
}

const SLEEP_TEMPLATES: Record<Sleep, string[]> = {
  good: ['descansou bem no horário', 'dormiu direitinho'],
  fair: ['dormiu um pouco', 'o soninho foi tranquilo'],
  poor: ['teve dificuldade para dormir', 'dormiu mal hoje'],
  did_not_sleep: ['não conseguiu dormir hoje', 'ficou sem dormir'],
}

const ACCEPTANCE_TEMPLATES: Record<Acceptance, string[]> = {
  good: ['comeu bem', 'aceitou bem as refeições'],
  fair: ['comeu razoavelmente', 'aceitou parcialmente as refeições'],
  refused: ['não quis comer muito hoje', 'teve pouco apetite'],
}

const MEAL_LABEL: Record<Meal, string> = {
  breakfast: 'Café da manhã',
  morning_snack: 'Lanche da manhã',
  lunch: 'Almoço',
  afternoon_snack: 'Lanche da tarde',
  dinner: 'Jantar',
}

const ACCEPTANCE_STYLE: Record<Acceptance, { bg: string; text: string; label: string }> = {
  good: { bg: '#EAF3DE', text: '#4A7A3A', label: 'Comeu bem' },
  fair: { bg: '#FEF6E4', text: '#9A6F2A', label: 'Razoável' },
  refused: { bg: '#FDE8EC', text: '#A03050', label: 'Recusou' },
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
  hygiene: {
    bath: boolean
    brushing: boolean
    bowel_movement: boolean
    notes: string | null
  } | null
  messages: { id: string; content: string; created_at: string; read: boolean }[]
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
  return (
    <p style={{ color: '#C4A882' }} className="text-xs font-medium mb-3">
      {children}
    </p>
  )
}

function Divider() {
  return (
    <div style={{ height: '0.5px', backgroundColor: '#C4A882', opacity: 0.25, margin: '10px 0' }} />
  )
}

function PrimaryText({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p style={{ color: '#A08060' }} className={`text-sm leading-relaxed ${className}`}>
      {children}
    </p>
  )
}

function SecondaryText({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p style={{ color: '#C4A882' }} className={`text-xs leading-relaxed ${className}`}>
      {children}
    </p>
  )
}

function hygienePhrase(h: DayLog['hygiene']): string {
  if (!h) return ''
  const done: string[] = []
  if (h.bath) done.push('tomou banho')
  if (h.brushing) done.push('escovou os dentinhos')
  if (h.bowel_movement) done.push('fez xixi e cocô')
  if (done.length === 0) return 'Nenhum cuidado registrado ainda.'
  const first = done[0].charAt(0).toUpperCase() + done[0].slice(1)
  if (done.length === 1) return `${first} hoje.`
  const rest = done.slice(1)
  const last = rest.pop()
  return rest.length > 0
    ? `${first}, ${rest.join(', ')} e ${last} hoje.`
    : `${first} e ${last} hoje.`
}

// ── Componente principal ──────────────────────────────────

export default function ChildHomePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [childName, setChildName] = useState('')
  const [dayLog, setDayLog] = useState<DayLog | null>(null)
  const [loading, setLoading] = useState(true)

  const today = new Date()
    .toLocaleDateString('pt-BR', {
      timeZone: 'America/Recife',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .split('/')
    .reverse()
    .join('-')

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: child } = await supabase.from('children').select('name').eq('id', id).single()
      if (child) setChildName(child.name.split(' ')[0])

      const { data: dl } = await supabase
        .from('daily_logs')
        .select('id, mood, mood_notes, sleep, sleep_notes')
        .eq('child_id', id)
        .eq('date', today)
        .single()

      if (!dl) {
        setLoading(false)
        return
      }

      const { data: al } = await supabase
        .from('attendance_logs')
        .select('present, check_out, picked_up_by, users(name, nickname)')
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

      const { data: msgs } = await supabase
        .from('messages')
        .select('id, content, created_at, read')
        .eq('child_id', id)
        .order('created_at', { ascending: false })
        .limit(5)

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
        messages: msgs ?? [],
      })

      setLoading(false)
    }
    load()
  }, [id])

  function buildNarrative(): React.ReactNode {
    if (!dayLog) return null
    const name = childName
    const parts: React.ReactNode[] = []

    if (dayLog.mood) {
      const template = pickRandom(MOOD_TEMPLATES[dayLog.mood])
      if (dayLog.mood_notes) {
        parts.push(<ExpandableText key="mood" text={template} detail={dayLog.mood_notes} />)
      } else {
        parts.push(<span key="mood">{template}</span>)
      }
    }

    const lunch = dayLog.feeding.find((f) => f.meal === 'lunch')
    const mainMeal = lunch ?? dayLog.feeding[0]
    if (mainMeal) {
      const template = pickRandom(ACCEPTANCE_TEMPLATES[mainMeal.acceptance])
      if (mainMeal.notes) {
        parts.push(<ExpandableText key="feeding" text={template} detail={mainMeal.notes} />)
      } else {
        parts.push(<span key="feeding">{template}</span>)
      }
    }

    if (dayLog.sleep) {
      const template = pickRandom(SLEEP_TEMPLATES[dayLog.sleep])
      if (dayLog.sleep_notes) {
        parts.push(<ExpandableText key="sleep" text={template} detail={dayLog.sleep_notes} />)
      } else {
        parts.push(<span key="sleep">{template}</span>)
      }
    }

    if (parts.length === 0) return `${name} teve seu dia registrado hoje.`

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

    if (dayLog.present === true) {
      chips.push({ label: 'Presente hoje', bg: '#EAF3DE', text: '#4A7A3A' })
    } else if (dayLog.present === false) {
      chips.push({ label: 'Faltou hoje', bg: '#FDE8EC', text: '#A03050' })
    }

    if (dayLog.sleep) {
      const sleepLabel: Record<Sleep, string> = {
        good: 'Dormiu bem',
        fair: 'Dormiu um pouco',
        poor: 'Dormiu mal',
        did_not_sleep: 'Não dormiu',
      }
      const sleepColor: Record<Sleep, { bg: string; text: string }> = {
        good: { bg: '#EEF0FE', text: '#4A4AAA' },
        fair: { bg: '#FEF6E4', text: '#9A6F2A' },
        poor: { bg: '#FDE8EC', text: '#A03050' },
        did_not_sleep: { bg: '#F5EFE8', text: '#8C7060' },
      }
      chips.push({ label: sleepLabel[dayLog.sleep], ...sleepColor[dayLog.sleep] })
    }

    if (dayLog.hygiene) {
      const done = [
        dayLog.hygiene.bath,
        dayLog.hygiene.brushing,
        dayLog.hygiene.bowel_movement,
      ].filter(Boolean).length
      if (done > 0) chips.push({ label: 'Cuidados feitos', bg: '#FEF0E8', text: '#9A5A2A' })
    }

    return chips
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span style={{ color: '#C4A882' }} className="text-sm">
          Carregando...
        </span>
      </div>
    )
  }

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const dayComplete = !!dayLog?.check_out

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-8">
      {/* Header */}
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-6 shadow-[0_2px_8px_rgba(180,140,120,0.06)]">
        <p style={{ color: '#C4A882' }} className="text-xs capitalize mb-1">
          {todayFormatted}
        </p>
        <h1 style={{ color: '#A08060' }} className="font-display text-2xl font-bold">
          O dia de {childName}
        </h1>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto flex flex-col gap-4">
        {/* Sem registro */}
        {!dayLog && (
          <Card padding="lg">
            <div className="flex flex-col items-center text-center py-8 gap-3">
              <div className="w-16 h-16 rounded-full bg-[#FEF0E8] flex items-center justify-center text-3xl">
                🌸
              </div>
              <p style={{ color: '#A08060' }} className="text-base font-semibold">
                O dia ainda está começando
              </p>
              <p style={{ color: '#C4A882' }} className="text-sm leading-relaxed">
                Assim que a professora registrar as novidades, elas vão aparecer aqui com carinho.
              </p>
            </div>
          </Card>
        )}

        {/* Narrativa + chips */}
        {dayLog && (
          <Card padding="lg">
            <PrimaryText className="mb-4">{buildNarrative()}</PrimaryText>

            {!dayComplete && (
              <SecondaryText className="italic mb-4">
                O dia ainda está acontecendo — mais novidades aparecem aqui ao longo do dia.
              </SecondaryText>
            )}

            {dayComplete && (
              <div
                className="flex items-center gap-2 rounded-[12px] px-3 py-2 mb-4"
                style={{ backgroundColor: '#F5EFE8' }}
              >
                <span className="text-base">👋</span>
                <SecondaryText>
                  Saiu às{' '}
                  {new Date(dayLog.check_out!).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Recife',
                  })}
                  {dayLog.picked_up_name ? ` com ${dayLog.picked_up_name}` : ''}
                </SecondaryText>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {buildChips().map((chip, i) => (
                <Chip key={i} {...chip} />
              ))}
            </div>
          </Card>
        )}

        {/* Alimentação */}
        {dayLog && dayLog.feeding.length > 0 && (
          <Card padding="lg">
            <SectionTitle>O que comeu hoje</SectionTitle>
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
        {dayLog?.hygiene &&
          (dayLog.hygiene.bath || dayLog.hygiene.brushing || dayLog.hygiene.bowel_movement) && (
            <Card padding="lg">
              <SectionTitle>Cuidados do dia</SectionTitle>
              <PrimaryText>{hygienePhrase(dayLog.hygiene)}</PrimaryText>
              {dayLog.hygiene.notes && (
                <>
                  <Divider />
                  <SecondaryText>{dayLog.hygiene.notes}</SecondaryText>
                </>
              )}
            </Card>
          )}

        {/* Recados */}
        {dayLog && dayLog.messages.length > 0 && (
          <Card padding="lg">
            <SectionTitle>Recado da professora</SectionTitle>
            <div className="flex flex-col">
              {dayLog.messages.map((m, i) => (
                <div key={m.id}>
                  <div className="flex items-start justify-between gap-3 py-1">
                    <PrimaryText className="flex-1">{m.content}</PrimaryText>
                    {!m.read && (
                      <span
                        style={{ backgroundColor: '#FEF0E8', color: '#C05A2A' }}
                        className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
                      >
                        Novo
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#C4A882' }} className="text-[10px] pb-1">
                    {new Date(m.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {i < dayLog.messages.length - 1 && <Divider />}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
