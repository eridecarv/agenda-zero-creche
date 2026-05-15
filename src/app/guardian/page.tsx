// src/app/responsavel/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type CriancaVinculada = {
  id: string
  nome: string
  data_nascimento: string | null
}

type Comunicado = {
  id: string
  titulo: string
  conteudo: string
  criado_em: string
}

export default function ResponsavelPage() {
  const router = useRouter()
  const supabase = createClient()

  const [criancas, setCriancas] = useState<CriancaVinculada[]>([])
  const [comunicados, setComunicados] = useState<Comunicado[]>([])
  const [nomeResponsavel, setNomeResponsavel] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('nome, escola_id')
        .eq('id', user.id)
        .single()

      if (usuario) setNomeResponsavel(usuario.nome.split(' ')[0])

      const { data: vinculos } = await supabase
        .from('vinculos')
        .select('criancas(id, nome, data_nascimento)')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .is('data_fim', null)

      if (vinculos) {
        const lista = vinculos
          .map((v: any) => v.criancas)
          .filter(Boolean)
        setCriancas(lista)
      }

      if (usuario?.escola_id) {
        const { data: comms } = await supabase
          .from('comunicados')
          .select('id, titulo, conteudo, criado_em')
          .eq('escola_id', usuario.escola_id)
          .order('criado_em', { ascending: false })
          .limit(10)

        if (comms) setComunicados(comms)
      }

      setLoading(false)
    }
    init()
  }, [])

  function calcularIdade(dataNasc: string | null): string {
    if (!dataNasc) return ''
    const nasc = new Date(dataNasc)
    const hoje = new Date()
    const meses =
      (hoje.getFullYear() - nasc.getFullYear()) * 12 +
      (hoje.getMonth() - nasc.getMonth())
    if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
    const anos = Math.floor(meses / 12)
    const mesesRest = meses % 12
    if (mesesRest === 0) return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
    return `${anos}a ${mesesRest}m`
  }

  function saudacao(): string {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  function formatarData(iso: string): string {
    const d = new Date(iso)
    const hoje = new Date()
    const ontem = new Date(hoje)
    ontem.setDate(hoje.getDate() - 1)

    if (d.toDateString() === hoje.toDateString()) return 'Hoje'
    if (d.toDateString() === ontem.toDateString()) return 'Ontem'
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  }

  async function handleSair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8C7060] mb-0.5">{saudacao()},</p>
            <h1 className="font-display text-2xl font-bold text-[#3A2E24]">
              {nomeResponsavel || 'Responsável'} 👋
            </h1>
          </div>
          <button
            onClick={handleSair}
            className="text-sm text-[#8C7060] hover:text-[#E86C88] transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto flex flex-col gap-8">

        {/* Crianças */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#8C7060] mb-3">
            {criancas.length === 1 ? 'Sua criança' : 'Suas crianças'}
          </p>

          <div className="flex flex-col gap-3">
            {criancas.length === 0 && (
              <div className="text-center py-10">
                <p className="text-2xl mb-2">👶</p>
                <p className="text-sm text-[#B0A090]">Nenhuma criança vinculada ainda.</p>
              </div>
            )}

            {criancas.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/responsavel/crianca/${c.id}`)}
                className="
                  w-full text-left
                  rounded-[20px] bg-[#FFFDF9] p-5
                  shadow-[0_2px_8px_rgba(180,140,120,0.12)]
                  flex items-center gap-4
                  active:scale-[0.98] transition-transform duration-200
                "
              >
                {/* Avatar */}
                <div className="
                  w-14 h-14 rounded-full flex-shrink-0
                  flex items-center justify-center text-2xl
                  bg-gradient-to-br from-[#FFB899] to-[#FF8C66]
                ">
                  👶
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-[#3A2E24] truncate">
                    {c.nome}
                  </p>
                  {c.data_nascimento && (
                    <p className="text-xs text-[#8C7060] mt-0.5">
                      {calcularIdade(c.data_nascimento)}
                    </p>
                  )}
                </div>

                <svg
                  className="w-4 h-4 text-[#C8B8A8] flex-shrink-0"
                  fill="none" stroke="currentColor" strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </section>

        {/* Comunicados */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#8C7060] mb-3">
            Comunicados
          </p>

          {comunicados.length === 0 ? (
            <div className="
              rounded-[20px] bg-[#FFFDF9] p-6
              shadow-[0_2px_8px_rgba(180,140,120,0.08)]
              flex flex-col items-center gap-2
            ">
              <p className="text-2xl">📭</p>
              <p className="text-sm text-[#B0A090] text-center">
                Nenhum comunicado por enquanto.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {comunicados.map((c) => (
                <div
                  key={c.id}
                  className="
                    rounded-[20px] bg-[#FFFDF9] p-5
                    shadow-[0_2px_8px_rgba(180,140,120,0.08)]
                  "
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-[#3A2E24] leading-snug">
                      {c.titulo}
                    </p>
                    <span className="text-xs text-[#B0A090] flex-shrink-0 mt-0.5">
                      {formatarData(c.criado_em)}
                    </span>
                  </div>
                  <p className="text-sm text-[#8C7060] leading-relaxed line-clamp-3">
                    {c.conteudo}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}