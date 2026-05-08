/**
 * AdmDiariosPage — lista de turmas para registro de diário.
 * Rota: /adm/diarios
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Turma } from '@/types'

const TURNO_LABEL: Record<string, string> = {
  manha: 'Manhã', tarde: 'Tarde', integral: 'Integral', noite: 'Noite',
}

export default function AdmDiariosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('turmas')
        .select('*')
        .is('desativado_em', null)
        .order('nome')

      if (data) setTurmas(data)
      setLoading(false)
    }
    carregar()
  }, [])

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long'
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
        <p className="text-xs text-[#8C7060] mt-1 capitalize">{hoje}</p>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto flex flex-col gap-3">
        {turmas.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">🏫</p>
            <p className="text-sm text-[#B0A090]">Nenhuma turma cadastrada.</p>
          </div>
        )}

        {turmas.map(t => (
          <button
            key={t.id}
            onClick={() => router.push(`/adm/diarios/${t.id}`)}
            className="
              w-full text-left rounded-[20px] bg-[#FFFDF9] p-5
              shadow-[0_2px_8px_rgba(180,140,120,0.12)]
              flex items-center justify-between
              active:scale-[0.97] transition-all duration-200
            "
          >
            <div>
              <p className="text-sm font-semibold text-[#3A2E24]">{t.nome}</p>
              {t.turno && (
                <p className="text-xs text-[#8C7060] mt-0.5">
                  {TURNO_LABEL[t.turno] ?? t.turno}
                </p>
              )}
            </div>
            <span className="text-[#C8B8A8]">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}