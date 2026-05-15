// src/app/guardian/child/[id]/dailylog/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'

type DaySummary = {
  date: string         // 'YYYY-MM-DD'
  mood: string | null
  present: boolean | null
  complete: boolean    // tem check_out preenchido
}

const MOOD_EMOJI: Record<string, string> = {
  contente:  '😄',
  tranquilo: '😌',
  agitado:   '😤',
  choroso:   '😢',
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function DailyLogHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [childName, setChildName] = useState('')
  const [days, setDays] = useState<DaySummary[]>([])
  const [loading, setLoading] = useState(true)

  // Data de hoje para excluir do histórico (hoje já aparece na home)
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: child } = await supabase
        .from('children').select('name').eq('id', id).single()
      if (child) setChildName(child.name.split(' ')[0])

      // Busca registros diários excluindo hoje, ordenado do mais recente
      const { data: dls } = await supabase
        .from('daily_logs')
        .select('id, date, mood')
        .eq('child_id', id)
        .neq('date', today)
        .order('date', { ascending: false })
        .limit(60) // últimos ~2 meses

      if (!dls || dls.length === 0) { setLoading(false); return }

      // Busca presença e saída de todos esses registros
      const dlIds = dls.map((d: any) => d.id)
      const { data: attendanceLogs } = await supabase
        .from('attendance_logs')
        .select('daily_log_id, present, check_out')
        .in('daily_log_id', dlIds)

      const attendanceMap: Record<string, { present: boolean | null; check_out: string | null }> = {}
      attendanceLogs?.forEach((a: any) => {
        attendanceMap[a.daily_log_id] = { present: a.present, check_out: a.check_out }
      })

      setDays(
        dls.map((dl: any) => ({
          date: dl.date,
          mood: dl.mood,
          present: attendanceMap[dl.id]?.present ?? null,
          complete: !!attendanceMap[dl.id]?.check_out,
        }))
      )

      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span style={{ color: '#C4A882' }} className="text-sm">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-8">
      {/* Header */}
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-6 shadow-[0_2px_8px_rgba(180,140,120,0.06)]">
        <p style={{ color: '#C4A882' }} className="text-xs mb-1">Histórico</p>
        <h1 style={{ color: '#A08060' }} className="font-display text-2xl font-bold">
          Dias anteriores
        </h1>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto flex flex-col gap-3">
        {days.length === 0 ? (
          <Card padding="lg">
            <div className="flex flex-col items-center text-center py-8 gap-3">
              <div className="w-16 h-16 rounded-full bg-[#FEF0E8] flex items-center justify-center text-3xl">📖</div>
              <p style={{ color: '#A08060' }} className="text-base font-semibold">
                Ainda sem histórico
              </p>
              <p style={{ color: '#C4A882' }} className="text-sm leading-relaxed">
                Os dias registrados vão aparecer aqui.
              </p>
            </div>
          </Card>
        ) : (
          days.map(day => (
            <button
              key={day.date}
              onClick={() => router.push(`/guardian/child/${id}/dailylog/${day.date}`)}
              className="w-full text-left"
            >
              <Card padding="lg" className="hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <p style={{ color: '#A08060' }} className="text-sm font-semibold capitalize">
                      {formatDate(day.date)}
                    </p>
                    <div className="flex items-center gap-2">
                      {day.present === false && (
                        <span
                          style={{ backgroundColor: '#FDE8EC', color: '#A03050' }}
                          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                        >
                          Faltou
                        </span>
                      )}
                      {day.present === true && day.complete && (
                        <span
                          style={{ backgroundColor: '#EAF3DE', color: '#4A7A3A' }}
                          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                        >
                          Dia completo
                        </span>
                      )}
                      {day.present === true && !day.complete && (
                        <span
                          style={{ backgroundColor: '#FEF6E4', color: '#9A6F2A' }}
                          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                        >
                          Parcial
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {day.mood && (
                      <span className="text-2xl">{MOOD_EMOJI[day.mood] ?? '😊'}</span>
                    )}
                    <span style={{ color: '#C4A882' }} className="text-sm">›</span>
                  </div>
                </div>
              </Card>
            </button>
          ))
        )}
      </div>
    </div>
  )
}