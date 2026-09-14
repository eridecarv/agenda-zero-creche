/**
 * DailyLogsPage — lista de turmas para registro de diário.
 * Rota: /adm/dailylogs
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Class } from '@/types'

const SHIFT_LABEL: Record<string, string> = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  full_day: 'Integral',
  night: 'Noite',
}

export default function DailyLogsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('classes')
        .select('*')
        .is('deactivated_at', null)
        .order('name')

      if (data) setClasses(data)
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span className="text-sm text-[#8C7060]">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      {/* Header */}
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-6 shadow-[0_2px_8px_rgba(180,140,120,0.08)]">
        <button
          onClick={() => router.push('/adm')}
          className="text-sm text-[#8C7060] mb-3 flex items-center gap-1"
        >
          ← Painel
        </button>
        <h1 className="font-display text-2xl font-bold text-[#3A2E24]">Diários</h1>
        <p className="text-xs text-[#8C7060] mt-1 capitalize">{today}</p>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto flex flex-col gap-3">
        {classes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">🏫</p>
            <p className="text-sm text-[#B0A090]">Nenhuma turma cadastrada.</p>
          </div>
        )}

        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/adm/dailylogs/${c.id}`)}
            className="
              w-full text-left rounded-[20px] bg-[#FFFDF9] p-5
              shadow-[0_2px_8px_rgba(180,140,120,0.12)]
              flex items-center justify-between
              active:scale-[0.97] transition-all duration-200
            "
          >
            <div>
              <p className="text-sm font-semibold text-[#3A2E24]">{c.name}</p>
              {c.shift && (
                <p className="text-xs text-[#8C7060] mt-0.5">{SHIFT_LABEL[c.shift] ?? c.shift}</p>
              )}
            </div>
            <span className="text-[#C8B8A8]">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}
