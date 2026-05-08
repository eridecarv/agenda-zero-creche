/**
 * AdmDiariosTurmaPage — lista de crianças da turma para registro.
 * Rota: /adm/diarios/[turmaId]
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import type { Crianca, Turma } from '@/types'

export default function AdmDiariosTurmaPage() {
  const router = useRouter()
  const params = useParams()
  const turmaId = params.turmaId as string
  const supabase = createClient()

  const [turma, setTurma] = useState<Turma | null>(null)
  const [criancas, setCriancas] = useState<Crianca[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const { data: t } = await supabase
        .from('turmas')
        .select('*')
        .eq('id', turmaId)
        .single()

      if (t) setTurma(t)

      const { data: ct } = await supabase
        .from('crianca_turma')
        .select('criancas(*)')
        .eq('turma_id', turmaId)
        .is('data_fim', null)

      if (ct) {
        const lista = ct
          .map((r: any) => r.criancas)
          .filter(Boolean)
          .sort((a: Crianca, b: Crianca) => a.nome.localeCompare(b.nome))
        setCriancas(lista)
      }

      setLoading(false)
    }
    carregar()
  }, [turmaId])

  const hoje = new Date().toISOString().split('T')[0]

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
          onClick={() => router.push('/adm/diarios')}
          className="text-sm text-[#8C7060] mb-3 flex items-center gap-1"
        >
          ← Diários
        </button>
        <h1 className="font-display text-2xl font-bold text-[#3A2E24]">
          {turma?.nome ?? 'Turma'}
        </h1>
        <p className="text-xs text-[#8C7060] mt-1">
          {criancas.length} {criancas.length === 1 ? 'criança' : 'crianças'}
        </p>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto flex flex-col gap-3">
        {criancas.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">👶</p>
            <p className="text-sm text-[#B0A090]">Nenhuma criança nesta turma.</p>
          </div>
        )}

        {criancas.map(c => (
          <button
            key={c.id}
            onClick={() => router.push(`/adm/diarios/${turmaId}/${c.id}`)}
            className="
              w-full text-left rounded-[20px] bg-[#FFFDF9] p-4
              shadow-[0_2px_8px_rgba(180,140,120,0.12)]
              flex items-center gap-4
              active:scale-[0.97] transition-all duration-200
            "
          >
            <Avatar nome={c.nome} tamanho="sm" />
            <span className="flex-1 text-sm font-semibold text-[#3A2E24]">
              {c.nome}
            </span>
            <span className="
              text-xs font-medium text-[#FF8C66]
              bg-[#FFF0E8] px-3 py-1 rounded-full
            ">
              + Registrar
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}