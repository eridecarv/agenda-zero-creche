/**
 * AdmDiarioCriancaPage — registro do diário de uma criança.
 * Rota: /adm/diarios/[turmaId]/[criancaId]
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { DiarioForm } from '@/components/ui/DiarioForm'
import { Avatar } from '@/components/ui/Avatar'
import type { Crianca } from '@/types'

export default function AdmDiarioCriancaPage() {
  const router = useRouter()
  const params = useParams()
  const turmaId = params.turmaId as string
  const criancaId = params.criancaId as string
  const supabase = createClient()

  const [crianca, setCrianca] = useState<Crianca | null>(null)
  const [escolaId, setEscolaId] = useState<string | null>(null)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const hoje = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setUsuarioId(user.id)

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('escola_id')
        .eq('id', user.id)
        .single()

      if (usuario) setEscolaId(usuario.escola_id)

      const { data: c } = await supabase
        .from('criancas')
        .select('*')
        .eq('id', criancaId)
        .single()

      if (c) setCrianca(c)

      setLoading(false)
    }
    carregar()
  }, [criancaId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span className="text-sm text-[#8C7060]">Carregando...</span>
      </div>
    )
  }

  if (!crianca || !escolaId || !usuarioId) return null

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">

      {/* Header */}
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-6 shadow-[0_2px_8px_rgba(180,140,120,0.08)]">
        <button
          onClick={() => router.push(`/adm/diarios/${turmaId}`)}
          className="text-sm text-[#8C7060] mb-3 flex items-center gap-1"
        >
          ← Turma
        </button>
        <div className="flex items-center gap-3">
          <Avatar nome={crianca.nome} tamanho="md" />
          <div>
            <h1 className="font-display text-xl font-bold text-[#3A2E24]">
              {crianca.nome}
            </h1>
            <p className="text-xs text-[#8C7060] mt-0.5">
              Diário de hoje · {new Date().toLocaleDateString('pt-BR', {
                day: 'numeric', month: 'long'
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        <DiarioForm
          criancaId={criancaId}
          escolaId={escolaId}
          data={hoje}
          registradoPor={usuarioId}
          onSalvo={() => router.push(`/adm/diarios/${turmaId}`)}
        />
      </div>

    </div>
  )
}